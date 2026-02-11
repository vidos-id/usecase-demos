import { z } from "zod";

export const ExtractedClaimsSchema = z.object({
	familyName: z.string(),
	givenName: z.string(),
	birthDate: z.string(),
	nationality: z.string(),
	identifier: z.string(),
	address: z.string().optional(),
	portrait: z.string().optional(),
});

export type ExtractedClaims = z.infer<typeof ExtractedClaimsSchema>;
