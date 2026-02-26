import { z } from "zod";

/**
 * Vidos validation error detail item
 */
export const vidosErrorDetailSchema = z.object({
	detail: z.string(),
	pointer: z.string().optional(),
});
export type VidosErrorDetail = z.infer<typeof vidosErrorDetailSchema>;

/**
 * Vidos policy error - returned when a validation policy fails
 */
export const vidosPolicyErrorSchema = z.object({
	path: z.array(z.union([z.string(), z.number()])).optional(),
	policy: z.string(),
	service: z.string().optional(),
	error: z.object({
		type: z.string().optional(),
		title: z.string(),
		detail: z.string(),
		vidosType: z.string().optional(),
		errors: z.array(vidosErrorDetailSchema).optional(),
	}),
});
export type VidosPolicyError = z.infer<typeof vidosPolicyErrorSchema>;

/**
 * Known Vidos error types for better UX messaging
 */
export const vidosErrorTypes = {
	credentialQuery: "credential-query-evaluation",
	trustedIssuer: "trusted-issuer-untrusted",
	identityMismatch: "identity-mismatch",
} as const;
export type VidosErrorType =
	(typeof vidosErrorTypes)[keyof typeof vidosErrorTypes];

/**
 * User-friendly error info for client display
 */
export const authorizationErrorInfoSchema = z.object({
	/** Machine-readable error type */
	errorType: z.string(),
	/** User-friendly title */
	title: z.string(),
	/** User-friendly detail message */
	detail: z.string(),
	/** Specific error items (e.g., missing claims) */
	errors: z.array(vidosErrorDetailSchema).optional(),
	/** The policy that failed */
	policy: z.string().optional(),
});
export type AuthorizationErrorInfo = z.infer<
	typeof authorizationErrorInfoSchema
>;

/**
 * Parse a Vidos error response into a user-friendly format
 */
export function parseVidosError(error: unknown): AuthorizationErrorInfo | null {
	const parsed = vidosPolicyErrorSchema.safeParse(error);
	if (!parsed.success) {
		return null;
	}

	const { policy, error: err } = parsed.data;

	return {
		errorType: err.vidosType ?? policy,
		title: err.title,
		detail: err.detail,
		errors: err.errors,
		policy,
	};
}

/**
 * Get user-friendly messaging based on error type.
 * Includes detailed info from Vidos for demo/debugging purposes.
 */
export function getErrorUserMessage(errorInfo: AuthorizationErrorInfo): {
	title: string;
	description: string;
	actionHint?: string;
	technicalDetails?: string[];
} {
	// Extract technical details from nested errors
	const technicalDetails = errorInfo.errors
		?.map((e) => {
			if (e.pointer) {
				return `${e.pointer}: ${e.detail}`;
			}
			return e.detail;
		})
		.filter(Boolean);

	switch (errorInfo.errorType) {
		case vidosErrorTypes.credentialQuery:
			return {
				title: "Credential Doesn't Match Requirements",
				description: errorInfo.detail,
				actionHint:
					"Please try again with a credential that includes the required attributes.",
				technicalDetails,
			};

		case vidosErrorTypes.trustedIssuer:
			return {
				title: "Credential Issuer Not Trusted",
				description: errorInfo.detail,
				actionHint: "Please use a credential from a recognized issuer.",
				technicalDetails,
			};

		case vidosErrorTypes.identityMismatch:
			return {
				title: "Identity Mismatch",
				description: errorInfo.detail,
				actionHint:
					"Please try again using the same credential you used to sign in.",
				technicalDetails,
			};

		default:
			return {
				title: errorInfo.title,
				description: errorInfo.detail,
				technicalDetails,
			};
	}
}
