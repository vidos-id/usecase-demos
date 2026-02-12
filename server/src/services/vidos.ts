import createClient from "openapi-fetch";
import type { z } from "zod";
import { env } from "../env";
import type { paths } from "../generated/authorizer-api";

export type PresentationMode = "direct_post" | "dc_api";

// Singleton client instance
let authorizerClient: ReturnType<typeof createClient<paths>> | null = null;

function getAuthorizerClient() {
	if (!authorizerClient) {
		authorizerClient = createClient<paths>({
			baseUrl: env.VIDOS_AUTHORIZER_URL,
			headers: {
				Authorization: env.VIDOS_API_KEY
					? `Bearer ${env.VIDOS_API_KEY}`
					: undefined,
			},
		});
	}
	return authorizerClient;
}

export interface CreateAuthRequestParams {
	mode: PresentationMode;
	requestedClaims: string[]; // e.g. ["family_name", "given_name", "birth_date"]
	purpose: string;
}

export type CreateAuthRequestResult =
	| {
			mode: "direct_post";
			authorizationId: string;
			authorizeUrl: string;
	  }
	| {
			mode: "dc_api";
			authorizationId: string;
			dcApiRequest: Record<string, unknown>;
			responseUrl: string;
	  };

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

export async function vidosAuthorizerHealthCheck(): Promise<boolean> {
	const client = getAuthorizerClient();
	const { error, response } = await client.GET("/health", {});

	if (error) {
		console.error("Health check failed:", error);
		return false;
	}

	return response.status === 204;
}

const PID_VCT = "urn:eudi:pid:1";

/**
 * Builds a DCQL query for SD-JWT PID credentials.
 * Claims should use actual SD-JWT names (e.g. "birthdate", "nationalities", "picture").
 */
function buildPIDDCQLQuery(requestedClaims: string[], purpose?: string) {
	return {
		purpose,
		credentials: [
			{
				id: "pid",
				format: "dc+sd-jwt",
				meta: { vct_values: [PID_VCT] },
				claims: requestedClaims.map((claim) => ({ path: [claim] })),
			},
		],
	};
}

/**
 * Creates an authorization request with the Vidos Authorizer API using DCQL.
 * Supports both direct_post (QR code) and dc_api (browser Digital Credentials API) modes.
 */
export async function createAuthorizationRequest(
	params: CreateAuthRequestParams,
): Promise<CreateAuthRequestResult> {
	const { mode, requestedClaims, purpose } = params;
	const client = getAuthorizerClient();

	console.log("[Vidos] createAuthorizationRequest", { mode, requestedClaims });

	// Build DCQL query with proper SD-JWT paths and meta
	const dcqlQuery = buildPIDDCQLQuery(requestedClaims, purpose);

	if (mode === "direct_post") {
		const { data, error } = await client.POST(
			"/openid4/vp/v1_0/authorizations",
			{
				body: {
					query: {
						type: "DCQL",
						dcql: dcqlQuery,
					},
					responseMode: "direct_post.jwt",
				},
			},
		);

		if (error) {
			console.error("[Vidos] createAuthorizationRequest error:", error);
			throw new Error(`Vidos API error: ${error.message}`);
		}

		if (!data || !("authorizeUrl" in data)) {
			throw new Error("Vidos API returned unexpected response format");
		}

		console.log(
			"[Vidos] createAuthorizationRequest success:",
			data.authorizationId,
		);
		return {
			mode: "direct_post",
			authorizationId: data.authorizationId,
			authorizeUrl: data.authorizeUrl,
		};
	}

	// dc_api mode
	const { data, error } = await client.POST("/openid4/vp/v1_0/authorizations", {
		body: {
			query: {
				type: "DCQL",
				dcql: dcqlQuery,
			},
			responseMode: "dc_api.jwt",
			protocol: "openid4vp-v1-unsigned",
		},
	});

	if (error) {
		console.error("[Vidos] createAuthorizationRequest error:", error);
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data || !("digitalCredentialGetRequest" in data)) {
		console.error("[Vidos] unexpected response format:", data);
		throw new Error("Vidos API returned unexpected response format");
	}

	console.log(
		"[Vidos] createAuthorizationRequest success:",
		data.authorizationId,
	);
	return {
		mode: "dc_api",
		authorizationId: data.authorizationId,
		dcApiRequest: data.digitalCredentialGetRequest as Record<string, unknown>,
		responseUrl: data.responseUrl,
	};
}

/**
 * Polls the authorization status from the Vidos Authorizer API.
 * Used to check if the user has completed the verification flow.
 */
export async function pollAuthorizationStatus(
	authorizationId: string,
): Promise<PollStatusResult> {
	const client = getAuthorizerClient();

	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/status",
		{
			params: { path: { authorizationId } },
		},
	);

	if (error) {
		console.error("[Vidos] pollAuthorizationStatus error:", error);
		if ("message" in error && error.message.includes("404")) {
			throw new Error("Authorization not found");
		}
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data) {
		throw new Error("Vidos API returned empty response");
	}

	// Map Vidos status to our status enum
	// API returns: "created" | "pending" | "authorized" | "rejected" | "error" | "expired"
	const mappedStatus =
		data.status === "created"
			? "pending"
			: (data.status as AuthorizationStatus);

	console.log(
		"[Vidos] pollAuthorizationStatus:",
		authorizationId,
		"->",
		mappedStatus,
	);
	return {
		status: mappedStatus,
	};
}

/**
 * Forwards the DC API response to the Vidos Authorizer API for verification.
 * Used when the browser Digital Credentials API is used for verification.
 */
export async function forwardDCAPIResponse(
	params: ForwardDCAPIParams,
): Promise<ForwardDCAPIResult> {
	const { authorizationId, origin, dcResponse } = params;
	const client = getAuthorizerClient();

	console.log("[Vidos] forwardDCAPIResponse:", authorizationId);

	// Determine which endpoint to use based on response format
	if ("response" in dcResponse) {
		// JWT response format
		const { data, error } = await client.POST(
			"/openid4/vp/v1_0/{authorizationId}/dc_api.jwt",
			{
				params: { path: { authorizationId } },
				body: {
					origin,
					digitalCredentialGetResponse: dcResponse,
				},
			},
		);

		if (error) {
			console.error("[Vidos] forwardDCAPIResponse error:", error);
			throw new Error(`Vidos API error: ${error.message}`);
		}

		if (!data) {
			throw new Error("Vidos API returned empty response");
		}

		console.log("[Vidos] forwardDCAPIResponse result:", data.status);
		return { status: data.status };
	}

	// vp_token response format - cast to expected type
	const { data, error } = await client.POST(
		"/openid4/vp/v1_0/{authorizationId}/dc_api",
		{
			params: { path: { authorizationId } },
			body: {
				origin,
				digitalCredentialGetResponse: dcResponse as {
					vp_token: {
						[key: string]:
							| string
							| (string | { [key: string]: unknown })[]
							| { [key: string]: unknown };
					};
				},
			},
		},
	);

	if (error) {
		console.error("[Vidos] forwardDCAPIResponse error:", error);
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data) {
		throw new Error("Vidos API returned empty response");
	}

	console.log("[Vidos] forwardDCAPIResponse result:", data.status);
	return { status: data.status };
}

/**
 * Retrieves extracted credentials from a completed authorization.
 * Validates against provided schema for flow-specific requirements.
 */
export async function getExtractedCredentials<T extends z.ZodTypeAny>(
	authorizationId: string,
	schema: T,
): Promise<z.infer<T>> {
	const client = getAuthorizerClient();

	console.log("[Vidos] getExtractedCredentials:", authorizationId);

	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/credentials",
		{
			params: { path: { authorizationId } },
		},
	);

	if (error) {
		console.error("[Vidos] getExtractedCredentials error:", error);
		if ("message" in error && error.message.includes("404")) {
			throw new Error("Authorization not found");
		}
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data) {
		throw new Error("Vidos API returned empty response");
	}

	if (!data.credentials || data.credentials.length === 0) {
		console.error("[Vidos] no credentials in response:", data);
		throw new Error("No credentials found in authorization");
	}

	const credential = data.credentials[0];
	if (!credential) {
		throw new Error("No credentials found in authorization");
	}

	const claims = credential.claims as Record<string, unknown>;
	console.log("[Vidos] extracted claims:", Object.keys(claims));

	return schema.parse(claims);
}
