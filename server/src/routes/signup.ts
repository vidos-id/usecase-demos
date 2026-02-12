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
	deletePendingRequest,
	getPendingRequestById,
} from "../stores/pending-auth-requests";
import { createSession } from "../stores/sessions";
import { createUser } from "../stores/users";

// Signup claims for PID - full set per spec
const SIGNUP_CLAIMS = [
	"family_name",
	"given_name",
	"birth_date",
	"birth_place",
	"nationality",
	"resident_address",
	"personal_administrative_number",
	"document_number",
	"portrait",
];

export const signupRouter = new Hono()
	.post("/request", zValidator("json", signupRequestSchema), async (c) => {
		const { mode } = c.req.valid("json");

		const result = await createAuthorizationRequest({
			mode,
			requestedClaims: SIGNUP_CLAIMS,
			purpose: "Verify your identity for signup",
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "signup",
			mode,
			responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
		});

		const response = signupRequestResponseSchema.parse(
			result.mode === "direct_post"
				? {
						mode: "direct_post",
						requestId: pendingRequest.id,
						authorizationId: result.authorizationId,
						authorizeUrl: result.authorizeUrl,
					}
				: {
						mode: "dc_api",
						requestId: pendingRequest.id,
						authorizationId: result.authorizationId,
						dcApiRequest: result.dcApiRequest,
						responseUrl: result.responseUrl,
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

			deletePendingRequest(pendingRequest.id);

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

			deletePendingRequest(pendingRequest.id);

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
