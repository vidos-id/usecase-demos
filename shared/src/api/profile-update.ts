import { z } from "zod";
import { credentialFormatsSchema, dcApiRequestSchema } from "../types/auth";

const profileUpdateRequestBaseSchema = z.object({
	requestedClaims: z.array(z.string()).min(1),
});

export const profileUpdateRequestSchema = z.discriminatedUnion("mode", [
	profileUpdateRequestBaseSchema.extend({
		mode: z.literal("direct_post"),
		credentialFormats: credentialFormatsSchema,
	}),
	profileUpdateRequestBaseSchema.extend({
		mode: z.literal("dc_api"),
		origin: z.url(),
		credentialFormats: credentialFormatsSchema,
	}),
]);
export type ProfileUpdateRequest = z.infer<typeof profileUpdateRequestSchema>;

const profileUpdateRequestResponseBaseSchema = z.object({
	requestId: z.string(),
});

export const profileUpdateRequestResponseSchema = z.discriminatedUnion("mode", [
	profileUpdateRequestResponseBaseSchema.extend({
		mode: z.literal("direct_post"),
		authorizeUrl: z.url(),
		requestedClaims: z.array(z.string()),
		purpose: z.string(),
	}),
	profileUpdateRequestResponseBaseSchema.extend({
		mode: z.literal("dc_api"),
		dcApiRequest: dcApiRequestSchema,
		requestedClaims: z.array(z.string()),
		purpose: z.string(),
	}),
]);
export type ProfileUpdateRequestResponse = z.infer<
	typeof profileUpdateRequestResponseSchema
>;

export const profileUpdateCompleteRequestSchema = z.object({
	origin: z.string(),
	dcResponse: z.record(z.string(), z.unknown()),
});
export type ProfileUpdateCompleteRequest = z.infer<
	typeof profileUpdateCompleteRequestSchema
>;

export const profileUpdateCompleteResponseSchema = z.object({
	updatedFields: z.array(z.string()),
});
export type ProfileUpdateCompleteResponse = z.infer<
	typeof profileUpdateCompleteResponseSchema
>;
