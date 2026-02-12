import { z } from "zod";

export const presentationModeSchema = z.enum(["direct_post", "dc_api"]);
export type PresentationMode = z.infer<typeof presentationModeSchema>;

/**
 * Extracted claims from PID SD-JWT credentials.
 * Uses actual SD-JWT claim names per EUDI PID Rulebook.
 */
export const ExtractedClaimsSchema = z.object({
	family_name: z.string(),
	given_name: z.string(),
	birthdate: z.string(),
	nationalities: z.string(),
	// Identifier - prefer personal_administrative_number, fallback to document_number
	personal_administrative_number: z.string().optional(),
	document_number: z.string().optional(),
	place_of_birth: z.string().optional(),
	picture: z.string().optional(),
});

export type ExtractedClaims = z.infer<typeof ExtractedClaimsSchema>;

/**
 * Get unique identifier from claims (personal_administrative_number or document_number)
 */
export function getIdentifier(claims: ExtractedClaims): string {
	const id = claims.personal_administrative_number ?? claims.document_number;
	if (!id) {
		throw new Error("No identifier found in claims");
	}
	return id;
}
