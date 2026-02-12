import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	signupCompleteRequestSchema,
	signupCompleteResponseSchema,
	signupRequestResponseSchema,
	signupRequestSchema,
	signupStatusResponseSchema,
} from "shared/api/signup";
import {
	createAuthorizationRequest,
	forwardDCAPIResponse,
	getExtractedCredentials,
	pollAuthorizationStatus,
} from "../services/vidos";
import {
	createPendingRequest,
	getPendingRequestById,
	updateRequestToCompleted,
} from "../stores/pending-auth-requests";
import { createSession } from "../stores/sessions";
import { createUser } from "../stores/users";

// Signup attributes for PID
const SIGNUP_ATTRIBUTES = [
	"family_name",
	"given_name",
	"birth_date",
	"nationality",
	"personal_administrative_number",
	"document_number",
	"portrait",
];

export const signupRouter = new Hono()
	.post("/request", zValidator("json", signupRequestSchema), async (c) => {
		const { mode } = c.req.valid("json");

		const result = await createAuthorizationRequest({
			mode,
			requestedAttributes: SIGNUP_ATTRIBUTES,
			flow: "signup",
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "signup",
			mode,
			responseUrl: result.responseUrl,
		});

		const response = signupRequestResponseSchema.parse({
			requestId: pendingRequest.id,
			authorizeUrl: result.authorizeUrl,
			dcApiRequest: result.dcApiRequest,
		});

		return c.json(response);
	})
	.get("/status/:requestId", async (c) => {
		const requestId = c.req.param("requestId");
		const pendingRequest = getPendingRequestById(requestId);

		if (!pendingRequest) {
			const response = signupStatusResponseSchema.parse({
				status: "expired" as const,
			});
			return c.json(response);
		}

		// Poll Vidos for status
		const statusResult = await pollAuthorizationStatus(
			pendingRequest.vidosAuthorizationId,
		);

		if (statusResult.status === "authorized") {
			// Get credentials and create user
			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
			);

			const user = createUser({
				identifier: claims.identifier,
				familyName: claims.familyName,
				givenName: claims.givenName,
				birthDate: claims.birthDate,
				nationality: claims.nationality,
				address: claims.address,
				portrait: claims.portrait,
			});

			const session = createSession({
				userId: user.id,
				mode: pendingRequest.mode,
			});

			updateRequestToCompleted(pendingRequest.id, claims, session.id);

			const response = signupStatusResponseSchema.parse({
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

		const response = signupStatusResponseSchema.parse({
			status: statusResult.status,
		});

		return c.json(response);
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

			// Get credentials and create user
			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
			);

			const user = createUser({
				identifier: claims.identifier,
				familyName: claims.familyName,
				givenName: claims.givenName,
				birthDate: claims.birthDate,
				nationality: claims.nationality,
				address: claims.address,
				portrait: claims.portrait,
			});

			const session = createSession({
				userId: user.id,
				mode: pendingRequest.mode,
			});

			updateRequestToCompleted(pendingRequest.id, claims, session.id);

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
