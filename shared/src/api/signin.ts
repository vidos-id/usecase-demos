import { z } from "zod";
import { presentationModeSchema } from "../types/auth";

export const signinRequestSchema = z.object({
	mode: presentationModeSchema,
});
export type SigninRequest = z.infer<typeof signinRequestSchema>;

const signinRequestResponseBaseSchema = z.object({
	requestId: z.string(),
});

export const signinRequestResponseSchema = z.discriminatedUnion("mode", [
	signinRequestResponseBaseSchema.extend({
		mode: z.literal("direct_post"),
		authorizeUrl: z.url(),
	}),
	signinRequestResponseBaseSchema.extend({
		mode: z.literal("dc_api"),
		dcApiRequest: z.record(z.string(), z.unknown()),
	}),
]);
export type SigninRequestResponse = z.infer<typeof signinRequestResponseSchema>;

export const signinStatusResponseSchema = z.object({
	status: z.enum([
		"pending",
		"authorized",
		"rejected",
		"error",
		"expired",
		"not_found",
	]),
	sessionId: z.string().optional(),
	user: z
		.object({
			id: z.string(),
			familyName: z.string(),
			givenName: z.string(),
		})
		.optional(),
	mode: presentationModeSchema.optional(),
	error: z.string().optional(),
});
export type SigninStatusResponse = z.infer<typeof signinStatusResponseSchema>;

export const signinCompleteRequestSchema = z.object({
	origin: z.string(),
	dcResponse: z.record(z.string(), z.unknown()),
});
export type SigninCompleteRequest = z.infer<typeof signinCompleteRequestSchema>;

export const signinCompleteResponseSchema = z.object({
	sessionId: z.string(),
	user: z.object({
		id: z.string(),
		familyName: z.string(),
		givenName: z.string(),
	}),
	mode: presentationModeSchema,
});
export type SigninCompleteResponse = z.infer<
	typeof signinCompleteResponseSchema
>;
