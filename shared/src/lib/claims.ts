import { buildClaimLabels } from "./pid-attributes";

/**
 * Claim label mapping - converts canonical PID attribute IDs to human-readable labels.
 * Built from the centralized PID_ATTRIBUTE_MAPPINGS.
 */
export const CLAIM_LABELS: Record<string, string> = buildClaimLabels();

/**
 * Flow-specific claim configurations.
 * Uses canonical attribute IDs that map to both SD-JWT and mDoc formats.
 *
 * Note: These IDs are format-agnostic. The server's DCQL builder translates them
 * to format-specific paths (e.g., "birth_date" -> ["birthdate"] for SD-JWT,
 * ["eu.europa.ec.eudi.pid.1", "birth_date"] for mDoc).
 */
export const SIGNUP_CLAIMS = [
	"family_name",
	"given_name",
	"birth_date", // Canonical ID - maps to "birthdate" (SD-JWT) or "birth_date" (mDoc)
	// "email_address", // Removed - EUDI doesn't consistently provide email
	"birth_place", // Canonical ID - maps to "place_of_birth" in both formats
	"nationality", // Canonical ID - maps to "nationalities" (SD-JWT) or "nationality" (mDoc)
	"personal_administrative_number",
	"document_number",
	"portrait", // Canonical ID - maps to "picture" (SD-JWT) or "portrait" (mDoc)
] as const;

export const SIGNIN_CLAIMS = ["personal_administrative_number"] as const;

export const PAYMENT_CLAIMS = [
	"personal_administrative_number",
	"family_name",
	"given_name",
] as const;

export const LOAN_CLAIMS = [
	"personal_administrative_number",
	"family_name",
	"given_name",
] as const;

export const PROFILE_UPDATE_CLAIMS = [
	"personal_administrative_number",
	"family_name",
	"given_name",
	"birth_date",
	"nationality",
	"email_address",
	"resident_address",
	"portrait",
] as const;

/**
 * Flow-specific purpose strings
 */
export const SIGNUP_PURPOSE = "Verify your identity for signup";
export const SIGNIN_PURPOSE = "Verify your identity for signin";
export const PAYMENT_PURPOSE = "Confirm your identity for payment";
export const LOAN_PURPOSE = "Verify your identity for loan application";
export const PROFILE_UPDATE_PURPOSE = "Verify your identity for profile update";
