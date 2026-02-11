import z from "zod";

export const otherQuerySchema = z.object({
	otherField: z.string(),
});
export const otherResponseSchema = z.object({
	message: z.string(),
	success: z.boolean(),
});

export type OtherQuery = z.infer<typeof otherQuerySchema>;
export type OtherResponse = z.infer<typeof otherResponseSchema>;
