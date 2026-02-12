import { z } from "zod";
import { presentationModeSchema } from "../types/auth";

export const signupRequestSchema = z.object({
	mode: presentationModeSchema,
});
export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const signupRequestResponseSchema = z.object({
	requestId: z.string(),
	authorizeUrl: z.string().url().optional(),
	dcApiRequest: z.record(z.string(), z.unknown()).optional(),
});
export type SignupRequestResponse = z.infer<typeof signupRequestResponseSchema>;

export const signupStatusResponseSchema = z.object({
	status: z.enum(["pending", "authorized", "rejected", "error", "expired"]),
	sessionId: z.string().optional(),
	user: z
		.object({
			id: z.string(),
			familyName: z.string(),
			givenName: z.string(),
		})
		.optional(),
	mode: presentationModeSchema.optional(),
});
export type SignupStatusResponse = z.infer<typeof signupStatusResponseSchema>;

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
