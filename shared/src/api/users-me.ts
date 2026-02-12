import { z } from "zod";

export const userProfileResponseSchema = z.object({
	id: z.string(),
	familyName: z.string(),
	givenName: z.string(),
	birthDate: z.string(),
	nationality: z.string(),
	address: z.string().optional(),
	portrait: z.string().optional(),
});

export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
