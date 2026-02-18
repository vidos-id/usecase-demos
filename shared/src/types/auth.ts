import { z } from "zod";

export const presentationModeSchema = z.enum(["direct_post", "dc_api"]);
export type PresentationMode = z.infer<typeof presentationModeSchema>;

export const CREDENTIAL_FORMATS = ["sd-jwt", "mdoc"] as const;
export const credentialFormatSchema = z.enum(CREDENTIAL_FORMATS);
export type CredentialFormat = z.infer<typeof credentialFormatSchema>;

export const credentialFormatsSchema = z
	.array(credentialFormatSchema)
	.min(1)
	.refine(
		(formats) => new Set(formats).size === formats.length,
		"Duplicate credential formats are not allowed",
	);
export type CredentialFormats = z.infer<typeof credentialFormatsSchema>;

export const CREDENTIAL_FORMAT_SELECTIONS = {
	all: ["sd-jwt", "mdoc"],
	sdJwtOnly: ["sd-jwt"],
	mdocOnly: ["mdoc"],
} as const satisfies Record<string, readonly CredentialFormat[]>;

/**
 * DC API protocols supported by Vidos authorizer
 * - openid4vp-v1-unsigned: Unsigned OpenID4VP request
 * - openid4vp-v1-signed: Signed OpenID4VP request (JWT)
 * - openid4vp-v1-multisigned: Multi-signed OpenID4VP request (JWS JSON serialization)
 */
export const dcApiProtocolSchema = z.enum([
	"openid4vp-v1-unsigned",
	"openid4vp-v1-signed",
	"openid4vp-v1-multisigned",
]);
export type DcApiProtocol = z.infer<typeof dcApiProtocolSchema>;

/**
 * Digital Credentials API request per W3C spec
 * https://www.w3.org/TR/digital-credentials/#the-digitalcredentialrequestoptions-dictionary
 */
export const dcApiRequestSchema = z.object({
	protocol: dcApiProtocolSchema,
	data: z.record(z.string(), z.unknown()),
});
export type DcApiRequest = z.infer<typeof dcApiRequestSchema>;

/**
 * Place of birth as per EUDI PID Rulebook - object with locality and/or country
 */
export const placeOfBirthSchema = z.object({
	locality: z.string().optional(),
	country: z.string().optional(),
});
export type PlaceOfBirth = z.infer<typeof placeOfBirthSchema>;

/**
 * Base PID claims schema - supports claims from both SD-JWT and mDoc formats.
 * Claims are parsed from a normalized payload in the server before schema validation.
 *
 * The system can request SD-JWT, mDoc, or both by passing one or more formats.
 *
 * SD-JWT claim names are used as the canonical schema (Vidos normalizes mDoc to these).
 */
export const pidClaimsSchema = z.object({
	// Identity
	family_name: z.string().optional(),
	given_name: z.string().optional(),
	birthdate: z.string().optional(), // SD-JWT: "birthdate", mDoc: "birth_date"
	email: z.string().optional(), // SD-JWT: "email", mDoc: "email_address"
	nationalities: z.array(z.string()).optional(), // SD-JWT: "nationalities", mDoc: "nationality" (string or array)
	place_of_birth: placeOfBirthSchema.optional(),
	picture: z.string().optional(), // SD-JWT: "picture", mDoc: "portrait"
	// Identifiers
	personal_administrative_number: z.string().optional(),
	document_number: z.string().optional(),
});
export type PidClaims = z.infer<typeof pidClaimsSchema>;

// ============================================================================
// Per-flow schemas - define what each flow requires from the presentation
// ============================================================================

/**
 * Sign-up flow: Need identity + identifier for account creation
 */
export const signupClaimsSchema = pidClaimsSchema.required({
	personal_administrative_number: true,
	family_name: true,
	given_name: true,
});
export type SignupClaims = z.infer<typeof signupClaimsSchema>;

/**
 * Sign-in flow: Only need identifier to match existing user
 */
export const signinClaimsSchema = pidClaimsSchema.required({
	personal_administrative_number: true,
});
export type SigninClaims = z.infer<typeof signinClaimsSchema>;

/**
 * Loan flow: Need identifier + name for verification
 */
export const loanClaimsSchema = pidClaimsSchema.required({
	personal_administrative_number: true,
	family_name: true,
	given_name: true,
});
export type LoanClaims = z.infer<typeof loanClaimsSchema>;

/**
 * Payment flow: Need identifier + name for verification
 */
export const paymentClaimsSchema = pidClaimsSchema.required({
	personal_administrative_number: true,
	family_name: true,
	given_name: true,
});
export type PaymentClaims = z.infer<typeof paymentClaimsSchema>;
