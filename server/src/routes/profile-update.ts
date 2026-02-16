import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	profileUpdateCompleteRequestSchema,
	profileUpdateCompleteResponseSchema,
	profileUpdateRequestResponseSchema,
	profileUpdateRequestSchema,
	profileUpdateStatusResponseSchema,
} from "shared/api/profile-update";
import {
	PROFILE_UPDATE_CLAIMS,
	PROFILE_UPDATE_PURPOSE,
} from "shared/lib/claims";
import { profileUpdateClaimsSchema } from "shared/types/profile-update";
import { vidosErrorTypes } from "shared/types/vidos-errors";
import { z } from "zod";
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
import { getSessionById } from "../stores/sessions";
import type { User } from "../stores/users";
import { getUserById, updateUser } from "../stores/users";

type ProfileUpdateMetadata = {
	requestedClaims: string[];
	userId: string;
};

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

function getSession(c: {
	req: { header: (name: string) => string | undefined };
}) {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) return null;
	return getSessionById(authHeader.slice(7));
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

function getProfileUpdateMetadata(
	metadata: unknown,
): ProfileUpdateMetadata | null {
	if (!metadata || typeof metadata !== "object") return null;
	const value = metadata as Partial<ProfileUpdateMetadata>;
	if (!Array.isArray(value.requestedClaims)) return null;
	if (typeof value.userId !== "string") return null;
	return { requestedClaims: value.requestedClaims, userId: value.userId };
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

			const result = await createAuthorizationRequest({
				...modeParams,
				requestedClaims,
				purpose: PROFILE_UPDATE_PURPOSE,
			});

			const pendingRequest = createPendingRequest({
				vidosAuthorizationId: result.authorizationId,
				type: "profile_update",
				mode: modeParams.mode,
				responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
				metadata: { requestedClaims, userId: session.userId },
			});

			const response = profileUpdateRequestResponseSchema.parse(
				result.mode === "direct_post"
					? {
							mode: "direct_post",
							requestId: pendingRequest.id,
							authorizeUrl: result.authorizeUrl,
							requestedClaims,
							purpose: PROFILE_UPDATE_PURPOSE,
						}
					: {
							mode: "dc_api",
							requestId: pendingRequest.id,
							dcApiRequest: result.dcApiRequest,
							requestedClaims,
							purpose: PROFILE_UPDATE_PURPOSE,
						},
			);

			return c.json(response);
		},
	)
	.get("/status/:requestId", async (c) => {
		const session = getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const requestId = c.req.param("requestId");
		const pendingRequest = getPendingRequestById(requestId);

		if (!pendingRequest) {
			return c.json({ error: "Request not found" }, 404);
		}

		const metadata = getProfileUpdateMetadata(pendingRequest.metadata);
		if (!metadata || metadata.userId !== session.userId) {
			return c.json({ error: "Unauthorized" }, 403);
		}

		const statusResult = await pollAuthorizationStatus(
			pendingRequest.vidosAuthorizationId,
		);

		if (statusResult.status === "authorized") {
			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
				profileUpdateClaimsExtendedSchema,
			);
			const user = getUserById(session.userId);

			if (!user) {
				deletePendingRequest(pendingRequest.id);
				return c.json({ error: "Unauthorized" }, 401);
			}

			if (
				claims.personal_administrative_number &&
				claims.personal_administrative_number !== user.identifier
			) {
				deletePendingRequest(pendingRequest.id);
				return c.json({
					status: "rejected" as const,
					errorInfo: {
						errorType: vidosErrorTypes.identityMismatch,
						title: "Identity Mismatch",
						detail:
							"The credential used for verification does not match your account identity.",
					},
				});
			}

			const { updates, updatedFields } = buildProfileUpdate(
				claims,
				metadata.requestedClaims,
			);
			updateUser(user.id, updates);
			deletePendingRequest(pendingRequest.id);

			const response = profileUpdateStatusResponseSchema.parse({
				status: "authorized" as const,
				updatedFields,
			});

			return c.json(response);
		}

		const response = profileUpdateStatusResponseSchema.parse({
			status: statusResult.status,
			errorInfo: statusResult.errorInfo,
		});

		return c.json(response);
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

			const metadata = getProfileUpdateMetadata(pendingRequest.metadata);
			if (!metadata || metadata.userId !== session.userId) {
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
				deletePendingRequest(pendingRequest.id);
				return c.json({ error: "Unauthorized" }, 401);
			}

			if (
				claims.personal_administrative_number &&
				claims.personal_administrative_number !== user.identifier
			) {
				deletePendingRequest(pendingRequest.id);
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
				metadata.requestedClaims,
			);
			updateUser(user.id, updates);
			deletePendingRequest(pendingRequest.id);

			const response = profileUpdateCompleteResponseSchema.parse({
				updatedFields,
			});

			return c.json(response);
		},
	);
