import z from "zod";

export const apiResponseSchema = z.object({
	message: z.string(),
	success: z.boolean(),
});

export type ApiResponse = z.infer<typeof apiResponseSchema>;
