import { z } from "zod";
import { dcApiRequestSchema, presentationModeSchema } from "../types/auth";

export const signupRequestSchema = z.discriminatedUnion("mode", [
	z.object({
		mode: z.literal("direct_post"),
	}),
	z.object({
		mode: z.literal("dc_api"),
		origin: z.url(),
	}),
]);
export type SignupRequest = z.infer<typeof signupRequestSchema>;

const signupRequestResponseBaseSchema = z.object({
	requestId: z.string(),
	authorizationId: z.string(),
});

export const signupRequestResponseSchema = z.discriminatedUnion("mode", [
	signupRequestResponseBaseSchema.extend({
		mode: z.literal("direct_post"),
		authorizeUrl: z.url(),
		requestedClaims: z.array(z.string()),
		purpose: z.string(),
	}),
	signupRequestResponseBaseSchema.extend({
		mode: z.literal("dc_api"),
		dcApiRequest: dcApiRequestSchema,
		responseUrl: z.url(),
		requestedClaims: z.array(z.string()),
		purpose: z.string(),
	}),
]);
export type SignupRequestResponse = z.infer<typeof signupRequestResponseSchema>;

export const signupCompleteRequestSchema = z.object({
	origin: z.string(),
	dcResponse: z.record(z.string(), z.unknown()),
});
export type SignupCompleteRequest = z.infer<typeof signupCompleteRequestSchema>;

export const signupCompleteResponseSchema = z.object({
	sessionId: z.string(),
	user: z.object({
		id: z.string(),
		familyName: z.string(),
		givenName: z.string(),
	}),
	mode: presentationModeSchema,
});
export type SignupCompleteResponse = z.infer<
	typeof signupCompleteResponseSchema
>;
