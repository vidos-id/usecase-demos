import { z } from "zod";

export const resetResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

export type ResetResponse = z.infer<typeof resetResponseSchema>;
