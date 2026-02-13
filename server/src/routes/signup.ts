import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	signupCompleteRequestSchema,
	signupCompleteResponseSchema,
	signupRequestResponseSchema,
	signupRequestSchema,
	signupStatusResponseSchema,
} from "shared/api/signup";
import { SIGNUP_CLAIMS, SIGNUP_PURPOSE } from "shared/lib/claims";
import { signupClaimsSchema } from "shared/types/auth";
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
import { createUser, getUserByIdentifier } from "../stores/users";

export const signupRouter = new Hono()
	.post("/request", zValidator("json", signupRequestSchema), async (c) => {
		const body = c.req.valid("json");

		const result = await createAuthorizationRequest({
			...body,
			requestedClaims: SIGNUP_CLAIMS,
			purpose: SIGNUP_PURPOSE,
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "signup",
			mode: body.mode,
			responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
		});

		const response = signupRequestResponseSchema.parse(
			result.mode === "direct_post"
				? {
						mode: "direct_post",
						requestId: pendingRequest.id,
						authorizationId: result.authorizationId,
						authorizeUrl: result.authorizeUrl,
						requestedClaims: SIGNUP_CLAIMS,
						purpose: SIGNUP_PURPOSE,
					}
				: {
						mode: "dc_api",
						requestId: pendingRequest.id,
						authorizationId: result.authorizationId,
						dcApiRequest: result.dcApiRequest,
						responseUrl: result.responseUrl,
						requestedClaims: SIGNUP_CLAIMS,
						purpose: SIGNUP_PURPOSE,
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
				deletePendingRequest(pendingRequest.id);
				const response = signupStatusResponseSchema.parse({
					status: "account_exists" as const,
				});
				return c.json(response);
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
			errorInfo: statusResult.errorInfo,
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
				deletePendingRequest(pendingRequest.id);
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
