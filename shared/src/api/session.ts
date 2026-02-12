import { z } from "zod";
import { presentationModeSchema } from "../types/auth";

export const sessionResponseSchema = z.discriminatedUnion("authenticated", [
	z.object({ authenticated: z.literal(false) }),
	z.object({
		authenticated: z.literal(true),
		userId: z.string(),
		mode: presentationModeSchema,
	}),
]);

export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const deleteSessionResponseSchema = z.object({
	success: z.boolean(),
});

export type DeleteSessionResponse = z.infer<typeof deleteSessionResponseSchema>;
