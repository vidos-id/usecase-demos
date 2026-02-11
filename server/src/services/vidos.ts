import { type ExtractedClaims, ExtractedClaimsSchema } from "shared/types/auth";
import { env } from "../env";

export type PresentationMode = "direct_post" | "dc_api";
export type CredentialFormat = "vc+sd-jwt" | "mso_mdoc";

export interface CreateAuthRequestParams {
	mode: PresentationMode;
	requestedAttributes: string[]; // e.g. ["family_name", "given_name", "birth_date"]
	flow: "signup" | "signin" | "payment" | "loan";
}

export interface CreateAuthRequestResult {
	authorizationId: string;
	// For direct_post mode: URL for QR code / deep link
	authorizeUrl?: string;
	// For dc_api mode: request object for navigator.credentials.get()
	dcApiRequest?: Record<string, unknown>;
	// For dc_api mode: URL to forward DC API response to
	responseUrl?: string;
}

export type AuthorizationStatus =
	| "pending"
	| "authorized"
	| "rejected"
	| "error"
	| "expired";

export interface PollStatusResult {
	status: AuthorizationStatus;
	error?: string;
}

export interface ForwardDCAPIParams {
	authorizationId: string;
	origin: string;
	dcResponse: { response: string } | { vp_token: Record<string, unknown> };
}

export interface ForwardDCAPIResult {
	status: AuthorizationStatus;
}

/**
 * Helper to extract error message from API response
 */
async function getErrorMessage(response: Response): Promise<string> {
	let message = `HTTP ${response.status}`;
	try {
		const errorData = await response.json();
		if (
			errorData &&
			typeof errorData === "object" &&
			"message" in errorData &&
			typeof errorData.message === "string"
		) {
			message = errorData.message;
		}
	} catch {
		// Ignore JSON parsing errors
	}
	return message;
}

/**
 * Map of snake_case claim names to camelCase ExtractedClaims field names
 */
const claimNameMap: Record<string, keyof ExtractedClaims> = {
	family_name: "familyName",
	given_name: "givenName",
	birth_date: "birthDate",
	birthdate: "birthDate", // Some credentials use this variant
	nationality: "nationality",
	resident_address: "address",
	portrait: "portrait",
};

/**
 * Retrieves and normalizes extracted credentials from a completed authorization.
 * Calls Vidos /credentials endpoint which returns normalized claims regardless of format (SD-JWT/mdoc).
 */
export async function getExtractedCredentials(
	authorizationId: string,
): Promise<ExtractedClaims> {
	try {
		const response = await fetch(
			`${env.VIDOS_AUTHORIZER_URL}/openid4/vp/v1_0/authorizations/${authorizationId}/credentials`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${env.VIDOS_API_KEY}`,
				},
			},
		);

		if (response.status === 404) {
			throw new Error(`Vidos API error (404): Authorization not found`);
		}

		if (!response.ok) {
			const message = await getErrorMessage(response);
			throw new Error(`Vidos API error (${response.status}): ${message}`);
		}

		let data: unknown;
		try {
			data = await response.json();
		} catch {
			throw new Error("Vidos API returned invalid JSON");
		}

		// Type guard for response data
		if (
			!data ||
			typeof data !== "object" ||
			!("credentials" in data) ||
			!Array.isArray(data.credentials)
		) {
			throw new Error("Vidos API returned unexpected response format");
		}

		const responseData = data as {
			authorizationId: string;
			credentials: {
				path: (string | number)[];
				format: string;
				credentialType: string;
				claims: Record<string, unknown>;
			}[];
		};

		// Check if any credentials returned
		if (responseData.credentials.length === 0) {
			throw new Error("No credentials found in authorization");
		}

		// Extract first credential's claims
		const credential = responseData.credentials[0];
		if (!credential) {
			throw new Error("No credentials found in authorization");
		}
		const rawClaims = credential.claims;

		// Normalize field names from snake_case to camelCase
		const normalizedClaims: Partial<ExtractedClaims> = {};

		// Map known fields
		for (const [snakeCase, camelCase] of Object.entries(claimNameMap)) {
			if (snakeCase in rawClaims) {
				const value = rawClaims[snakeCase];
				if (typeof value === "string") {
					normalizedClaims[camelCase] = value;
				}
			}
		}

		// Handle identifier field - check both possible sources
		if ("personal_administrative_number" in rawClaims) {
			const value = rawClaims.personal_administrative_number;
			if (typeof value === "string") {
				normalizedClaims.identifier = value;
			}
		} else if ("document_number" in rawClaims) {
			const value = rawClaims.document_number;
			if (typeof value === "string") {
				normalizedClaims.identifier = value;
			}
		}

		// Validate with Zod schema - will throw if required fields missing
		try {
			return ExtractedClaimsSchema.parse(normalizedClaims);
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(
					`Missing required claims or validation failed: ${error.message}. Received claims: ${JSON.stringify(normalizedClaims)}`,
				);
			}
			throw new Error(
				`Missing required claims or validation failed. Received claims: ${JSON.stringify(normalizedClaims)}`,
			);
		}
	} catch (error) {
		if (error instanceof Error) {
			// Re-throw our own errors
			if (
				error.message.startsWith("Vidos API") ||
				error.message.includes("Missing required claims") ||
				error.message.includes("No credentials found")
			) {
				throw error;
			}
			// Network or other errors
			throw new Error(`Vidos API network error: ${error.message}`);
		}
		throw new Error("Vidos API network error: Unknown error");
	}
}

/**
 * Creates an authorization request with the Vidos Authorizer API.
 * Supports both direct_post (QR code) and dc_api (browser Digital Credentials API) modes.
 */
export async function createAuthorizationRequest(
	params: CreateAuthRequestParams,
): Promise<CreateAuthRequestResult> {
	const { mode, requestedAttributes, flow } = params;

	// Build presentation definition with requested attributes
	const presentationDefinition = {
		id: crypto.randomUUID(),
		input_descriptors: [
			{
				id: "pid",
				name: "Person Identification Data",
				purpose: `Verify your identity for ${flow}`,
				constraints: {
					fields: requestedAttributes.map((attr) => ({
						path: [`$.${attr}`, `$.vc.credentialSubject.${attr}`],
						filter: { type: "string" },
					})),
				},
			},
		],
	};

	const requestBody = {
		query: {
			type: "DIF.PresentationExchange",
			presentationDefinition,
		},
		responseMode: mode === "direct_post" ? "direct_post.jwt" : "dc_api.jwt",
	};

	try {
		const response = await fetch(
			`${env.VIDOS_AUTHORIZER_URL}/openid4/vp/v1_0/authorizations`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${env.VIDOS_API_KEY}`,
				},
				body: JSON.stringify(requestBody),
			},
		);

		if (!response.ok) {
			const message = await getErrorMessage(response);
			throw new Error(`Vidos API error (${response.status}): ${message}`);
		}

		let data: unknown;
		try {
			data = await response.json();
		} catch {
			throw new Error("Vidos API returned invalid JSON");
		}

		// Type guard for response data
		if (!data || typeof data !== "object" || !("authorizationId" in data)) {
			throw new Error("Vidos API returned unexpected response format");
		}

		const responseData = data as {
			authorizationId: string;
			authorizeUrl?: string;
			digitalCredentialGetRequest?: Record<string, unknown>;
		};

		if (mode === "direct_post") {
			return {
				authorizationId: responseData.authorizationId,
				authorizeUrl: responseData.authorizeUrl,
			};
		}

		// dc_api mode
		return {
			authorizationId: responseData.authorizationId,
			dcApiRequest: responseData.digitalCredentialGetRequest,
			responseUrl: `${env.VIDOS_AUTHORIZER_URL}/openid4/vp/v1_0/${responseData.authorizationId}/dc_api.jwt`,
		};
	} catch (error) {
		if (error instanceof Error) {
			// Re-throw our own errors
			if (error.message.startsWith("Vidos API")) {
				throw error;
			}
			// Network or other errors
			throw new Error(`Vidos API network error: ${error.message}`);
		}
		throw new Error("Vidos API network error: Unknown error");
	}
}

/**
 * Polls the authorization status from the Vidos Authorizer API.
 * Used to check if the user has completed the verification flow.
 */
export async function pollAuthorizationStatus(
	authorizationId: string,
): Promise<PollStatusResult> {
	try {
		const response = await fetch(
			`${env.VIDOS_AUTHORIZER_URL}/openid4/vp/v1_0/authorizations/${authorizationId}/status`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${env.VIDOS_API_KEY}`,
				},
			},
		);

		if (response.status === 404) {
			throw new Error(`Vidos API error (404): Authorization not found`);
		}

		if (!response.ok) {
			const message = await getErrorMessage(response);
			throw new Error(`Vidos API error (${response.status}): ${message}`);
		}

		let data: unknown;
		try {
			data = await response.json();
		} catch {
			throw new Error("Vidos API returned invalid JSON");
		}

		// Type guard for response data
		if (!data || typeof data !== "object" || !("status" in data)) {
			throw new Error("Vidos API returned unexpected response format");
		}

		const responseData = data as {
			status: string;
			error?: string;
		};

		// Map Vidos status to our status enum
		// API returns: "created" | "pending" | "authorized" | "rejected" | "error" | "expired"
		// We map "created" to "pending" for simplicity
		const mappedStatus =
			responseData.status === "created" ? "pending" : responseData.status;

		// Validate status is one of our expected values
		const validStatuses: AuthorizationStatus[] = [
			"pending",
			"authorized",
			"rejected",
			"error",
			"expired",
		];
		if (!validStatuses.includes(mappedStatus as AuthorizationStatus)) {
			throw new Error(
				`Vidos API returned unexpected status: ${responseData.status}`,
			);
		}

		return {
			status: mappedStatus as AuthorizationStatus,
			error: responseData.error,
		};
	} catch (error) {
		if (error instanceof Error) {
			// Re-throw our own errors
			if (error.message.startsWith("Vidos API")) {
				throw error;
			}
			// Network or other errors
			throw new Error(`Vidos API network error: ${error.message}`);
		}
		throw new Error("Vidos API network error: Unknown error");
	}
}

/**
 * Forwards the DC API response to the Vidos Authorizer API for verification.
 * Used when the browser Digital Credentials API is used for verification.
 */
export async function forwardDCAPIResponse(
	params: ForwardDCAPIParams,
): Promise<ForwardDCAPIResult> {
	const { authorizationId, origin, dcResponse } = params;

	const requestBody = {
		origin,
		digitalCredentialGetResponse: dcResponse,
	};

	try {
		const response = await fetch(
			`${env.VIDOS_AUTHORIZER_URL}/openid4/vp/v1_0/${authorizationId}/dc_api.jwt`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${env.VIDOS_API_KEY}`,
				},
				body: JSON.stringify(requestBody),
			},
		);

		if (!response.ok) {
			const message = await getErrorMessage(response);
			throw new Error(`Vidos API error (${response.status}): ${message}`);
		}

		let data: unknown;
		try {
			data = await response.json();
		} catch {
			throw new Error("Vidos API returned invalid JSON");
		}

		// Type guard for response data
		if (!data || typeof data !== "object" || !("status" in data)) {
			throw new Error("Vidos API returned unexpected response format");
		}

		const responseData = data as {
			status: string;
		};

		// Validate status is one of our expected values
		// API returns: "authorized" | "rejected" | "error" | "expired"
		const validStatuses: AuthorizationStatus[] = [
			"authorized",
			"rejected",
			"error",
			"expired",
		];
		if (!validStatuses.includes(responseData.status as AuthorizationStatus)) {
			throw new Error(
				`Vidos API returned unexpected status: ${responseData.status}`,
			);
		}

		return {
			status: responseData.status as AuthorizationStatus,
		};
	} catch (error) {
		if (error instanceof Error) {
			// Re-throw our own errors
			if (error.message.startsWith("Vidos API")) {
				throw error;
			}
			// Network or other errors
			throw new Error(`Vidos API network error: ${error.message}`);
		}
		throw new Error("Vidos API network error: Unknown error");
	}
}
