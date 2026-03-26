import { z } from "zod";

export interface User {
	id: string;
	username: string;
	passwordHash: string;
	identityVerified: boolean;
	givenName: string | null;
	familyName: string | null;
	birthDate: string | null;
	createdAt: string;
}

export const signupRequestSchema = z.object({
	username: z.string().min(3).max(50),
	password: z.string().min(6).max(100),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const signinRequestSchema = z.object({
	username: z.string(),
	password: z.string(),
});

export type SigninRequest = z.infer<typeof signinRequestSchema>;

export const authResponseSchema = z.object({
	sessionId: z.string(),
	user: z.object({
		id: z.string(),
		username: z.string(),
		identityVerified: z.boolean(),
		givenName: z.string().nullable(),
		familyName: z.string().nullable(),
	}),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
