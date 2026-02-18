import { randomUUID } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	signupCompleteRequestSchema,
	signupCompleteResponseSchema,
	signupRequestResponseSchema,
	signupRequestSchema,
} from "shared/api/signup";
import { SIGNUP_CLAIMS, SIGNUP_PURPOSE } from "shared/lib/claims";
import { signupClaimsSchema } from "shared/types/auth";
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
import { createUser, getUserByIdentifier } from "../stores/users";

export const signupRouter = new Hono()
	.post("/request", zValidator("json", signupRequestSchema), async (c) => {
		const body = c.req.valid("json");
		const session = getSessionFromRequest(c) ?? undefined;
		const existingDebugSessionId = getDebugSessionIdFromRequest(c);
		const debugSessionId =
			session?.id ?? existingDebugSessionId ?? randomUUID();
		const shouldSetDebugCookie = !session && !existingDebugSessionId;
		const requestId = randomUUID();

		const result = await createAuthorizationRequest(
			{
				...body,
				requestedClaims: SIGNUP_CLAIMS,
				purpose: SIGNUP_PURPOSE,
			},
			{ requestId, flowType: "signup" },
		);

		const pendingRequest = createPendingRequest({
			id: requestId,
			vidosAuthorizationId: result.authorizationId,
			type: "signup",
			mode: body.mode,
			responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
			debugScope: {
				ownerUserId: session?.userId,
				ownerSessionId: debugSessionId,
			},
		});

		startAuthorizationMonitor(pendingRequest.id);

		const response = signupRequestResponseSchema.parse(
			result.mode === "direct_post"
				? {
						mode: "direct_post",
						requestId: pendingRequest.id,
						authorizationId: result.authorizationId,
						debugSessionId,
						authorizeUrl: result.authorizeUrl,
						requestedClaims: SIGNUP_CLAIMS,
						purpose: SIGNUP_PURPOSE,
					}
				: {
						mode: "dc_api",
						requestId: pendingRequest.id,
						authorizationId: result.authorizationId,
						debugSessionId,
						dcApiRequest: result.dcApiRequest,
						responseUrl: result.responseUrl,
						requestedClaims: SIGNUP_CLAIMS,
						purpose: SIGNUP_PURPOSE,
					},
		);

		if (shouldSetDebugCookie) {
			c.header("Set-Cookie", createDebugSessionCookie(debugSessionId));
		}

		return c.json(response);
	})
	.get("/stream/:requestId", (c) => {
		return streamAuthorizationRequest(c, {
			flowType: "signup",
			authorize: () => ({ ok: true }),
		});
	})
	.post(
		"/complete/:requestId",
		zValidator("json", signupCompleteRequestSchema),
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

			// Get credentials validated for signup flow
			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
				signupClaimsSchema,
			);

			// Check if user already exists
			const existingUser = getUserByIdentifier(
				claims.personal_administrative_number,
			);
			if (existingUser) {
				updateRequestToFailed(
					pendingRequest.id,
					"Account already exists",
					undefined,
					{
						status: "account_exists",
					},
				);
				return c.json({ error: "Account already exists" }, 400);
			}

			const user = createUser({
				identifier: claims.personal_administrative_number,
				familyName: claims.family_name,
				givenName: claims.given_name,
				birthDate: claims.birthdate ?? "",
				nationality: claims.nationalities?.join(", ") ?? "",
				email: claims.email,
				address: claims.place_of_birth
					? [claims.place_of_birth.locality, claims.place_of_birth.country]
							.filter(Boolean)
							.join(", ")
					: undefined,
				portrait: claims.picture,
				documentNumber: claims.document_number,
			});

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

			const response = signupCompleteResponseSchema.parse({
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
