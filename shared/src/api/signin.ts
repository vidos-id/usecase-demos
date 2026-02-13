import { z } from "zod";
import { dcApiRequestSchema, presentationModeSchema } from "../types/auth";
import { authorizationErrorInfoSchema } from "../types/vidos-errors";

export const signinRequestSchema = z.discriminatedUnion("mode", [
	z.object({
		mode: z.literal("direct_post"),
	}),
	z.object({
		mode: z.literal("dc_api"),
		origin: z.url(),
	}),
]);
export type SigninRequest = z.infer<typeof signinRequestSchema>;

const signinRequestResponseBaseSchema = z.object({
	requestId: z.string(),
});

export const signinRequestResponseSchema = z.discriminatedUnion("mode", [
	signinRequestResponseBaseSchema.extend({
		mode: z.literal("direct_post"),
		authorizeUrl: z.url(),
		requestedClaims: z.array(z.string()),
		purpose: z.string(),
	}),
	signinRequestResponseBaseSchema.extend({
		mode: z.literal("dc_api"),
		dcApiRequest: dcApiRequestSchema,
		requestedClaims: z.array(z.string()),
		purpose: z.string(),
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
	/** Detailed error information when status is rejected/error */
	errorInfo: authorizationErrorInfoSchema.optional(),
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
