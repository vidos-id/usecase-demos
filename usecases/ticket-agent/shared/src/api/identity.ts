import { z } from "zod";

export const identityVerifyResponseSchema = z.object({
	authorizationId: z.string(),
	authorizeUrl: z.string(),
});

export type IdentityVerifyResponse = z.infer<
	typeof identityVerifyResponseSchema
>;

export const identityStatusResponseSchema = z.object({
	status: z.enum(["pending", "authorized", "rejected", "error", "expired"]),
	user: z
		.object({
			identityVerified: z.boolean(),
			givenName: z.string().nullable(),
			familyName: z.string().nullable(),
		})
		.optional(),
});

export type IdentityStatusResponse = z.infer<
	typeof identityStatusResponseSchema
>;
