import { z } from "zod";
import {
	authResponseSchema,
	signinRequestSchema,
	signupRequestSchema,
} from "../types/users";

export { signupRequestSchema, signinRequestSchema, authResponseSchema };

export const errorResponseSchema = z.object({
	error: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
