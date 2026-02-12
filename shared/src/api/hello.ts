import { z } from "zod";

export const helloRequestSchema = z.object({
	name: z.string(),
	age: z.number(),
});

export const helloResponseSchema = z.object({
	message: z.string(),
	success: z.boolean(),
});

export type HelloRequest = z.infer<typeof helloRequestSchema>;
export type HelloResponse = z.infer<typeof helloResponseSchema>;
