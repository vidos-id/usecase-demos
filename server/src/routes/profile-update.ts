import { randomUUID } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { type Context, Hono } from "hono";
import {
	profileUpdateCompleteRequestSchema,
	profileUpdateCompleteResponseSchema,
	profileUpdateRequestResponseSchema,
	profileUpdateRequestSchema,
} from "shared/api/profile-update";
import {
	PROFILE_UPDATE_CLAIMS,
	PROFILE_UPDATE_PURPOSE,
} from "shared/lib/claims";
import { profileUpdateAuthMetadataSchema } from "shared/types/auth-metadata";
import { profileUpdateClaimsSchema } from "shared/types/profile-update";
import { vidosErrorTypes } from "shared/types/vidos-errors";
import { buildProfileUpdate } from "../lib/profile-update";
import { getSessionFromRequest } from "../lib/request-session";
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
import { getUserById, updateUser } from "../stores/users";

function getSession(c: Context) {
	return getSessionFromRequest(c);
}

export const profileUpdateRouter = new Hono()
	.post(
		"/request",
		zValidator("json", profileUpdateRequestSchema),
		async (c) => {
			const session = getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			const { requestedClaims, ...modeParams } = c.req.valid("json");
			const invalidClaims = requestedClaims.filter(
				(claim) =>
					!PROFILE_UPDATE_CLAIMS.includes(
						claim as (typeof PROFILE_UPDATE_CLAIMS)[number],
					),
			);

			if (requestedClaims.length === 0 || invalidClaims.length > 0) {
				return c.json({ error: "Invalid requested claims" }, 400);
			}

			// Always include personal_administrative_number to verify identity
			// This prevents updating profile with credentials from a different identity
			const claimsForVerification = [
				"personal_administrative_number",
				...requestedClaims,
			];
			const requestId = randomUUID();

			const result = await createAuthorizationRequest(
				{
					...modeParams,
					requestedClaims: claimsForVerification,
					purpose: PROFILE_UPDATE_PURPOSE,
				},
				{ requestId, flowType: "profile_update" },
			);

			const pendingRequest = createPendingRequest({
				id: requestId,
				vidosAuthorizationId: result.authorizationId,
				type: "profile_update",
				mode: modeParams.mode,
				responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
				metadata: {
					requestedClaims: claimsForVerification,
					userId: session.userId,
				},
			});

			startAuthorizationMonitor(pendingRequest.id);

			const response = profileUpdateRequestResponseSchema.parse(
				result.mode === "direct_post"
					? {
							mode: "direct_post",
							requestId: pendingRequest.id,
							authorizeUrl: result.authorizeUrl,
							requestedClaims: claimsForVerification,
							purpose: PROFILE_UPDATE_PURPOSE,
						}
					: {
							mode: "dc_api",
							requestId: pendingRequest.id,
							dcApiRequest: result.dcApiRequest,
							requestedClaims: claimsForVerification,
							purpose: PROFILE_UPDATE_PURPOSE,
						},
			);

			return c.json(response);
		},
	)
	.get("/stream/:requestId", (c) => {
		return streamAuthorizationRequest(c, {
			flowType: "profile_update",
			authorize: (ctx, pendingRequest) => {
				const session = getSession(ctx);
				if (!session) {
					return { ok: false, status: 401, message: "Unauthorized" } as const;
				}
				const parsed = profileUpdateAuthMetadataSchema.safeParse(
					pendingRequest.metadata,
				);
				if (!parsed.success || parsed.data.userId !== session.userId) {
					return { ok: false, status: 403, message: "Unauthorized" } as const;
				}
				return { ok: true } as const;
			},
		});
	})
	.post(
		"/complete/:requestId",
		zValidator("json", profileUpdateCompleteRequestSchema),
		async (c) => {
			const session = getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			const requestId = c.req.param("requestId");
			const { origin, dcResponse } = c.req.valid("json");

			const pendingRequest = getPendingRequestById(requestId);
			if (!pendingRequest) {
				return c.json({ error: "Request not found or expired" }, 404);
			}

			const parsedMetadata = profileUpdateAuthMetadataSchema.safeParse(
				pendingRequest.metadata,
			);
			if (
				!parsedMetadata.success ||
				parsedMetadata.data.userId !== session.userId
			) {
				return c.json({ error: "Unauthorized" }, 403);
			}

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

			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
				profileUpdateClaimsSchema,
			);
			const user = getUserById(session.userId);

			if (!user) {
				updateRequestToFailed(pendingRequest.id, "Unauthorized");
				return c.json({ error: "Unauthorized" }, 401);
			}

			// Identity verification is mandatory - reject if personal_administrative_number is missing
			if (!claims.personal_administrative_number) {
				updateRequestToFailed(
					pendingRequest.id,
					"Identity verification failed: personal identification number not provided.",
					{
						errorType: vidosErrorTypes.identityMismatch,
						title: "Identity Verification Failed",
						detail:
							"The credential must include a personal identification number for verification.",
					},
					{ status: "rejected" },
				);
				return c.json(
					{
						error: "Identity verification failed",
						errorInfo: {
							errorType: vidosErrorTypes.identityMismatch,
							title: "Identity Verification Failed",
							detail:
								"The credential must include a personal identification number for verification.",
						},
					},
					400,
				);
			}

			if (claims.personal_administrative_number !== user.identifier) {
				updateRequestToFailed(
					pendingRequest.id,
					"The credential used for verification does not match your account identity.",
					{
						errorType: vidosErrorTypes.identityMismatch,
						title: "Identity Mismatch",
						detail:
							"The credential used for verification does not match your account identity.",
					},
					{ status: "rejected" },
				);
				return c.json(
					{
						error: "Identity mismatch",
						errorInfo: {
							errorType: vidosErrorTypes.identityMismatch,
							title: "Identity Mismatch",
							detail:
								"The credential used for verification does not match your account identity.",
						},
					},
					400,
				);
			}

			const { updates, updatedFields } = buildProfileUpdate(
				claims,
				parsedMetadata.data.requestedClaims,
			);
			updateUser(user.id, updates);
			updateRequestToCompleted(pendingRequest.id, claims, undefined, {
				status: "authorized",
				updatedFields,
			});

			const response = profileUpdateCompleteResponseSchema.parse({
				updatedFields,
			});

			return c.json(response);
		},
	);
