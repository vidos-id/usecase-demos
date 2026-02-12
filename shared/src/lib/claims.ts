/**
 * Claim label mapping - converts technical PID claim names to human-readable labels
 */
export const CLAIM_LABELS: Record<string, string> = {
	family_name: "Family Name",
	given_name: "Given Name",
	birthdate: "Date of Birth",
	email: "Email Address",
	nationalities: "Nationalities",
	place_of_birth: "Place of Birth",
	personal_administrative_number: "Personal ID Number",
	document_number: "Document Number",
	picture: "Profile Picture",
};

/**
 * Flow-specific claim configurations
 */
export const SIGNUP_CLAIMS = [
	"family_name",
	"given_name",
	"birthdate",
	"email",
	"place_of_birth",
	"nationalities",
	"personal_administrative_number",
	"document_number",
	"picture",
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

/**
 * Flow-specific purpose strings
 */
export const SIGNUP_PURPOSE = "Verify your identity for signup";
export const SIGNIN_PURPOSE = "Verify your identity for signin";
export const PAYMENT_PURPOSE = "Confirm your identity for payment";
export const LOAN_PURPOSE = "Verify your identity for loan application";
