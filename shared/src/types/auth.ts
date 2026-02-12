import { z } from "zod";

export const presentationModeSchema = z.enum(["direct_post", "dc_api"]);
export type PresentationMode = z.infer<typeof presentationModeSchema>;

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
