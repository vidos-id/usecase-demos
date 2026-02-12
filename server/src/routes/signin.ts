import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	signinCompleteRequestSchema,
	signinCompleteResponseSchema,
	signinRequestResponseSchema,
	signinRequestSchema,
	signinStatusResponseSchema,
} from "shared/api/signin";
import { getIdentifier } from "shared/types/auth";
import {
	createAuthorizationRequest,
	forwardDCAPIResponse,
	getExtractedCredentials,
	pollAuthorizationStatus,
} from "../services/vidos";
import {
	createPendingRequest,
	deletePendingRequest,
	getPendingRequestById,
} from "../stores/pending-auth-requests";
import { createSession } from "../stores/sessions";
import { getUserByIdentifier } from "../stores/users";

// Signin claims for PID SD-JWT - minimal for identification
const SIGNIN_CLAIMS = [
	"personal_administrative_number",
	"document_number",
	"family_name",
	"given_name",
];

export const signinRouter = new Hono()
	.post("/request", zValidator("json", signinRequestSchema), async (c) => {
		const { mode } = c.req.valid("json");

		const result = await createAuthorizationRequest({
			mode,
			requestedClaims: SIGNIN_CLAIMS,
			purpose: "Verify your identity for signin",
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "signin",
			mode,
			responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
		});

		const response = signinRequestResponseSchema.parse(
			result.mode === "direct_post"
				? {
						mode: "direct_post",
						requestId: pendingRequest.id,
						authorizeUrl: result.authorizeUrl,
					}
				: {
						mode: "dc_api",
						requestId: pendingRequest.id,
						dcApiRequest: result.dcApiRequest,
					},
		);

		return c.json(response);
	})
	.get("/status/:requestId", async (c) => {
		const requestId = c.req.param("requestId");
		const pendingRequest = getPendingRequestById(requestId);

		if (!pendingRequest) {
			return c.json({ error: "Request not found" }, 404);
		}

		// Poll Vidos for status
		const statusResult = await pollAuthorizationStatus(
			pendingRequest.vidosAuthorizationId,
		);

		if (statusResult.status === "authorized") {
			// Get credentials and match user
			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
			);

			const user = getUserByIdentifier(getIdentifier(claims));

			if (!user) {
				const response = signinStatusResponseSchema.parse({
					status: "error" as const,
					error:
						"No account found. Please sign up first or use a different credential.",
				});
				return c.json(response);
			}

			const session = createSession({
				userId: user.id,
				mode: pendingRequest.mode,
			});

			deletePendingRequest(pendingRequest.id);

			const response = signinStatusResponseSchema.parse({
				status: "authorized" as const,
				sessionId: session.id,
				user: {
					id: user.id,
					familyName: user.familyName,
					givenName: user.givenName,
				},
				mode: pendingRequest.mode,
			});

			return c.json(response);
		}

		const response = signinStatusResponseSchema.parse({
			status: statusResult.status,
		});

		return c.json(response);
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
			const result = await forwardDCAPIResponse({
				authorizationId: pendingRequest.vidosAuthorizationId,
				origin,
				dcResponse: dcResponse as
					| { response: string }
					| { vp_token: Record<string, unknown> },
			});

			if (result.status !== "authorized") {
				return c.json({ error: "Verification failed" }, 400);
			}

			// Get credentials and match user
			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
			);

			const user = getUserByIdentifier(getIdentifier(claims));

			if (!user) {
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

			deletePendingRequest(pendingRequest.id);

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
