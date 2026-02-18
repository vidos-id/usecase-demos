import { randomUUID } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	signinCompleteRequestSchema,
	signinCompleteResponseSchema,
	signinRequestResponseSchema,
	signinRequestSchema,
} from "shared/api/signin";
import { SIGNIN_CLAIMS, SIGNIN_PURPOSE } from "shared/lib/claims";
import { signinClaimsSchema } from "shared/types/auth";
import {
	createDebugSessionCookie,
	getDebugSessionIdFromRequest,
	getSessionFromRequest,
} from "../lib/request-session";
import { startAuthorizationMonitor } from "../services/authorization-monitor";
import { streamAuthorizationRequest } from "../services/authorization-stream";
import {
	createAuthorizationRequest,
	forwardDCAPIResponse,
	getExtractedCredentials,
} from "../services/vidos";
import {
	createPendingRequest,
	getPendingRequestById,
	updateRequestToCompleted,
	updateRequestToFailed,
} from "../stores/pending-auth-requests";
import { createSession } from "../stores/sessions";
import { getUserByIdentifier } from "../stores/users";

export const signinRouter = new Hono()
	.post("/request", zValidator("json", signinRequestSchema), async (c) => {
		const body = c.req.valid("json");
		const session = getSessionFromRequest(c) ?? undefined;
		const existingDebugSessionId = getDebugSessionIdFromRequest(c);
		const debugSessionId =
			session?.id ?? existingDebugSessionId ?? randomUUID();
		const shouldSetDebugCookie = !session && !existingDebugSessionId;

		const result = await createAuthorizationRequest({
			...body,
			requestedClaims: SIGNIN_CLAIMS,
			purpose: SIGNIN_PURPOSE,
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "signin",
			mode: body.mode,
			responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
			debugScope: {
				ownerUserId: session?.userId,
				ownerSessionId: debugSessionId,
			},
		});

		startAuthorizationMonitor(pendingRequest.id);

		const response = signinRequestResponseSchema.parse(
			result.mode === "direct_post"
				? {
						mode: "direct_post",
						requestId: pendingRequest.id,
						debugSessionId,
						authorizeUrl: result.authorizeUrl,
						requestedClaims: SIGNIN_CLAIMS,
						purpose: SIGNIN_PURPOSE,
					}
				: {
						mode: "dc_api",
						requestId: pendingRequest.id,
						debugSessionId,
						dcApiRequest: result.dcApiRequest,
						requestedClaims: SIGNIN_CLAIMS,
						purpose: SIGNIN_PURPOSE,
					},
		);

		if (shouldSetDebugCookie) {
			c.header("Set-Cookie", createDebugSessionCookie(debugSessionId));
		}

		return c.json(response);
	})
	.get("/stream/:requestId", (c) => {
		return streamAuthorizationRequest(c, {
			flowType: "signin",
			authorize: () => ({ ok: true }),
		});
	})
	.post(
		"/complete/:requestId",
		zValidator("json", signinCompleteRequestSchema),
		async (c) => {
			const requestId = c.req.param("requestId");
			const { origin, dcResponse } = c.req.valid("json");

			const pendingRequest = getPendingRequestById(requestId);
			if (!pendingRequest) {
				return c.json({ error: "Request not found or expired" }, 404);
			}

			// Forward DC API response to Vidos
			const result = await forwardDCAPIResponse(
				{
					authorizationId: pendingRequest.vidosAuthorizationId,
					origin,
					dcResponse: dcResponse as
						| { response: string }
						| { vp_token: Record<string, unknown> },
				},
				{
					requestId: pendingRequest.id,
					flowType: pendingRequest.type,
				},
			);

			if (result.status !== "authorized") {
				return c.json(
					{
						error: "Verification failed",
						errorInfo: result.errorInfo,
					},
					400,
				);
			}

			// Get credentials validated for signin flow
			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
				signinClaimsSchema,
			);

			const user = getUserByIdentifier(claims.personal_administrative_number);

			if (!user) {
				updateRequestToFailed(
					pendingRequest.id,
					"No account found. Please sign up first or use a different credential.",
					undefined,
					{ status: "not_found" },
				);
				return c.json(
					{
						error:
							"No account found. Please sign up first or use a different credential.",
					},
					404,
				);
			}

			const session = createSession({
				userId: user.id,
				mode: pendingRequest.mode,
			});

			updateRequestToCompleted(pendingRequest.id, claims, session.id, {
				status: "authorized",
				mode: pendingRequest.mode,
				user: {
					id: user.id,
					familyName: user.familyName,
					givenName: user.givenName,
				},
			});

			const response = signinCompleteResponseSchema.parse({
				sessionId: session.id,
				user: {
					id: user.id,
					familyName: user.familyName,
					givenName: user.givenName,
				},
				mode: pendingRequest.mode,
			});

			return c.json(response);
		},
	);
