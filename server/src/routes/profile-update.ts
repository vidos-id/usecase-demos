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
import { z } from "zod";
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
import type { User } from "../stores/users";
import { getUserById, updateUser } from "../stores/users";

const profileUpdateAddressSchema = z.union([
	z.string(),
	z.object({
		formatted: z.string().optional(),
		street_address: z.string().optional(),
		locality: z.string().optional(),
		region: z.string().optional(),
		postal_code: z.string().optional(),
		country: z.string().optional(),
	}),
]);

const profileUpdateClaimsExtendedSchema = profileUpdateClaimsSchema.extend({
	birth_date: z.string().optional(),
	nationality: z.union([z.string(), z.array(z.string())]).optional(),
	email_address: z.string().optional(),
	portrait: z.string().optional(),
	address: profileUpdateAddressSchema.optional(),
	resident_address: z.string().optional(),
});

type ProfileUpdateClaims = z.infer<typeof profileUpdateClaimsExtendedSchema>;

function getSession(c: Context) {
	return getSessionFromRequest(c);
}

function buildProfileUpdate(
	claims: ProfileUpdateClaims,
	requestedClaims: string[],
): { updates: Partial<User>; updatedFields: string[] } {
	const updates: Partial<User> = {};
	const updatedFields: string[] = [];

	const requested = new Set(requestedClaims);

	if (requested.has("family_name") && claims.family_name) {
		updates.familyName = claims.family_name;
		updatedFields.push("familyName");
	}

	if (requested.has("given_name") && claims.given_name) {
		updates.givenName = claims.given_name;
		updatedFields.push("givenName");
	}

	if (requested.has("birth_date")) {
		const birthDate = claims.birthdate ?? claims.birth_date;
		if (birthDate) {
			updates.birthDate = birthDate;
			updatedFields.push("birthDate");
		}
	}

	if (requested.has("nationality")) {
		const normalizedNationalities =
			claims.nationalities ??
			(Array.isArray(claims.nationality)
				? claims.nationality
				: claims.nationality
					? [claims.nationality]
					: undefined);
		const nationality = normalizedNationalities?.join(", ");
		if (nationality) {
			updates.nationality = nationality;
			updatedFields.push("nationality");
		}
	}

	if (requested.has("email_address")) {
		const email = claims.email ?? claims.email_address;
		if (email) {
			updates.email = email;
			updatedFields.push("email");
		}
	}

	if (requested.has("portrait")) {
		const portrait = claims.picture ?? claims.portrait;
		if (portrait) {
			updates.portrait = portrait;
			updatedFields.push("portrait");
		}
	}

	if (requested.has("resident_address")) {
		const addressFromObject =
			claims.address && typeof claims.address === "object"
				? (claims.address.formatted ??
					[
						claims.address.street_address,
						claims.address.locality,
						claims.address.region,
						claims.address.postal_code,
						claims.address.country,
					]
						.filter(Boolean)
						.join(", "))
				: undefined;
		const address =
			claims.resident_address ??
			(typeof claims.address === "string" ? claims.address : undefined) ??
			addressFromObject;
		if (address) {
			updates.address = address;
			updatedFields.push("address");
		}
	}

	return { updates, updatedFields };
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

			const result = await createAuthorizationRequest({
				...modeParams,
				requestedClaims: claimsForVerification,
				purpose: PROFILE_UPDATE_PURPOSE,
			});

			const pendingRequest = createPendingRequest({
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

			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
				profileUpdateClaimsExtendedSchema,
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
