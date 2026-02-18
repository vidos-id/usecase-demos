import createClient from "openapi-fetch";
import type { AuthorizationFlowType } from "shared/api/authorization-sse";
import {
	PID_ATTRIBUTE_MAPPINGS,
	PID_MDOC_DOCTYPE,
	PID_MDOC_NAMESPACE,
	PID_SDJWT_VCT,
	type PIDAttributeMapping,
} from "shared/lib/pid-attributes";
import { normalizePidClaims } from "shared/lib/pid-claim-mapping";
import type { CredentialFormat, CredentialFormats } from "shared/types/auth";
import {
	type AuthorizationErrorInfo,
	parseVidosError,
} from "shared/types/vidos-errors";
import type { z } from "zod";
import { env } from "../env";
import type { paths } from "../generated/authorizer-api";
import { debugEmitters } from "../lib/debug-events";

export type PresentationMode = "direct_post" | "dc_api";

export type ModeParams =
	| { mode: "direct_post" }
	| { mode: "dc_api"; origin: string };

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

export type CreateAuthRequestParams = ModeParams & {
	requestedClaims: readonly string[]; // Canonical attribute IDs from pid-attributes.ts
	purpose: string;
	credentialFormats: CredentialFormats;
	transactionData?: string[]; // base64url-encoded JSON objects
	verifierInfo?: Array<{
		format: string;
		data: string | Record<string, unknown>;
		credential_ids?: string[];
	}>;
};

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
	errorInfo?: AuthorizationErrorInfo;
}

export interface ForwardDCAPIParams {
	authorizationId: string;
	origin: string;
	dcResponse: { response: string } | { vp_token: Record<string, unknown> };
}

export interface ForwardDCAPIResult {
	status: AuthorizationStatus;
	errorInfo?: AuthorizationErrorInfo;
}

type DebugContext = {
	requestId: string;
	flowType: AuthorizationFlowType;
};

export async function vidosAuthorizerHealthCheck(): Promise<boolean> {
	const client = getAuthorizerClient();
	const { error, response } = await client.GET("/health", {});

	if (error) {
		console.error("Health check failed:", error);
		return false;
	}

	return response.status === 204;
}

/**
 * Gets PID attribute mappings for requested canonical claim IDs.
 * Falls back to a generic mapping if attribute not found.
 */
function getAttributeMappings(
	requestedClaims: readonly string[],
): PIDAttributeMapping[] {
	return requestedClaims.map((claimId) => {
		const mapping = PID_ATTRIBUTE_MAPPINGS.find((attr) => attr.id === claimId);
		if (mapping) {
			return mapping;
		}
		// Fallback for unknown claims - use same path for both formats
		console.warn(
			`[Vidos] Unknown claim ID: ${claimId}, using fallback mapping`,
		);
		return {
			id: claimId,
			displayName: claimId,
			mdocPath: [claimId],
			sdJwtPath: [claimId],
		};
	});
}

/**
 * Builds a DCQL query for one or more PID credential formats.
 * Uses credential_sets only when multiple formats are requested.
 *
 * The query structure follows OpenID4VP DCQL specification:
 * - Two credential queries: one for SD-JWT, one for mDoc
 * - credential_sets with options array allowing either credential to satisfy the request
 *
 * @param requestedClaims Canonical attribute IDs (e.g., "family_name", "birth_date")
 * @param purpose Human-readable purpose for the credential request
 * @param credentialFormats One or more accepted credential formats
 */
function buildPIDDCQLQuery(
	requestedClaims: readonly string[],
	purpose: string,
	credentialFormats: CredentialFormats,
) {
	const attributeMappings = getAttributeMappings(requestedClaims);

	// Build SD-JWT credential query
	const sdJwtCredential = {
		id: "pid_sd_jwt",
		format: "dc+sd-jwt",
		meta: { vct_values: [PID_SDJWT_VCT] },
		claims: attributeMappings.map((attr) => ({ path: attr.sdJwtPath })),
	};

	// Build mDoc credential query with namespaced paths
	const mdocCredential = {
		id: "pid_mdoc",
		format: "mso_mdoc",
		meta: { doctype_value: PID_MDOC_DOCTYPE },
		claims: attributeMappings.map((attr) => ({
			path: [PID_MDOC_NAMESPACE, ...attr.mdocPath],
		})),
	};

	type CredentialQuery = typeof sdJwtCredential | typeof mdocCredential;
	const credentialByFormat: Record<CredentialFormat, CredentialQuery> = {
		"sd-jwt": sdJwtCredential,
		mdoc: mdocCredential,
	};

	const selectedCredentials = credentialFormats.map(
		(format) => credentialByFormat[format],
	);

	if (selectedCredentials.length === 1) {
		return {
			purpose,
			credentials: selectedCredentials,
		};
	}

	return {
		purpose,
		credentials: selectedCredentials,
		// credential_sets allows wallet to satisfy request with EITHER format
		credential_sets: [
			{
				// One option per format - wallet picks based on what it has
				options: selectedCredentials.map((credential) => [credential.id]),
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
	debugContext?: DebugContext,
): Promise<CreateAuthRequestResult> {
	const { requestedClaims, purpose, credentialFormats } = params;
	const client = getAuthorizerClient();

	// Build DCQL query with proper SD-JWT paths and meta
	const dcqlQuery = buildPIDDCQLQuery(
		requestedClaims,
		purpose,
		credentialFormats,
	);

	const endpoint = "/openid4/vp/v1_0/authorizations";

	if (params.mode === "direct_post") {
		const debugPayload = {
			query: { type: "DCQL", dcql: dcqlQuery },
			responseMode: "direct_post.jwt",
			responseTypeParameters: {
				transaction_data: params.transactionData,
				verifier_info: params.verifierInfo,
			},
		};

		if (debugContext) {
			debugEmitters.vidosRequest(
				debugContext,
				"createAuthorization",
				"POST",
				endpoint,
				debugPayload as Record<string, unknown>,
			);
		}

		const startedAt = Date.now();
		const { data, error, response } = await client.POST(endpoint, {
			body: {
				query: { type: "DCQL", dcql: dcqlQuery },
				responseMode: "direct_post.jwt",
				responseTypeParameters: {
					transaction_data: params.transactionData,
					verifier_info: params.verifierInfo,
				},
			},
		});
		const durationMs = Date.now() - startedAt;

		if (error) {
			if (debugContext) {
				debugEmitters.vidosResponse(
					debugContext,
					"createAuthorization",
					response?.status ?? 0,
					durationMs,
					false,
					undefined,
					error.message,
				);
			}
			console.error("[Vidos] createAuthorizationRequest error:", error);
			throw new Error(`Vidos API error: ${error.message}`);
		}

		if (!data || !("authorizeUrl" in data)) {
			if (debugContext) {
				debugEmitters.vidosResponse(
					debugContext,
					"createAuthorization",
					response?.status ?? 0,
					durationMs,
					false,
					undefined,
					"Unexpected response format",
				);
			}
			throw new Error("Vidos API returned unexpected response format");
		}

		if (debugContext) {
			debugEmitters.vidosResponse(
				debugContext,
				"createAuthorization",
				response.status,
				durationMs,
				true,
				{
					authorizationId: data.authorizationId,
					authorizeUrl: data.authorizeUrl,
					mode: "direct_post",
				},
			);
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
	if (debugContext) {
		debugEmitters.vidosRequest(
			debugContext,
			"createAuthorization",
			"POST",
			endpoint,
			{
				query: { type: "DCQL", dcql: dcqlQuery },
				responseMode: "dc_api.jwt",
				protocol: "openid4vp-v1-signed",
				expectedOrigins: [params.origin],
				responseTypeParameters: {
					transaction_data: params.transactionData,
					verifier_info: params.verifierInfo,
				},
			},
		);
	}

	const startedAt = Date.now();
	const { data, error, response } = await client.POST(endpoint, {
		body: {
			query: { type: "DCQL", dcql: dcqlQuery },
			responseMode: "dc_api.jwt",
			protocol: "openid4vp-v1-signed",
			expectedOrigins: [params.origin],
			responseTypeParameters: {
				transaction_data: params.transactionData,
				verifier_info: params.verifierInfo,
			},
		},
	});
	const durationMs = Date.now() - startedAt;

	if (error) {
		if (debugContext) {
			debugEmitters.vidosResponse(
				debugContext,
				"createAuthorization",
				response?.status ?? 0,
				durationMs,
				false,
				undefined,
				error.message,
			);
		}
		console.error("[Vidos] createAuthorizationRequest error:", error);
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data || !("digitalCredentialGetRequest" in data)) {
		if (debugContext) {
			debugEmitters.vidosResponse(
				debugContext,
				"createAuthorization",
				response?.status ?? 0,
				durationMs,
				false,
				undefined,
				"Unexpected response format",
			);
		}
		console.error("[Vidos] unexpected response format:", data);
		throw new Error("Vidos API returned unexpected response format");
	}

	if (debugContext) {
		debugEmitters.vidosResponse(
			debugContext,
			"createAuthorization",
			response.status,
			durationMs,
			true,
			{
				authorizationId: data.authorizationId,
				responseUrl: data.responseUrl,
				mode: "dc_api",
			},
		);
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
 * Fetches policy response errors for a rejected/error authorization.
 * Returns the raw policy data + parsed error info.
 */
async function getPolicyErrors(authorizationId: string): Promise<{
	errorInfo?: AuthorizationErrorInfo;
	policies?: Record<string, unknown>[];
}> {
	const client = getAuthorizerClient();

	try {
		const { data, error } = await client.GET(
			"/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response",
			{
				params: { path: { authorizationId } },
			},
		);

		if (error || !data?.data) {
			console.error("[Vidos] getPolicyErrors error:", error);
			return {};
		}

		const policies = data.data as Record<string, unknown>[];

		// Find first policy with an error
		for (const policyResult of data.data) {
			if (policyResult.error && typeof policyResult.error === "object") {
				const parsed = parseVidosError(policyResult);
				if (parsed) {
					console.log("[Vidos] parsed policy error:", parsed);
					return { errorInfo: parsed, policies };
				}
			}
		}

		return { policies };
	} catch (err) {
		console.error("[Vidos] getPolicyErrors exception:", err);
		return {};
	}
}

/**
 * Polls the authorization status from the Vidos Authorizer API.
 * Used to check if the user has completed the verification flow.
 *
 * Debug events are suppressed for intermediate pending polls to reduce noise:
 * - isFirstPoll=true: emits a "polling started" summary request event
 * - subsequent pending polls: no debug events emitted
 * - terminal poll: emits the final response event
 */
export async function pollAuthorizationStatus(
	authorizationId: string,
	debugContext?: DebugContext,
	isFirstPoll?: boolean,
): Promise<PollStatusResult> {
	const client = getAuthorizerClient();
	const endpoint =
		"/openid4/vp/v1_0/authorizations/{authorizationId}/status" as const;

	if (debugContext && isFirstPoll) {
		debugEmitters.vidosRequest(debugContext, "pollStatus", "GET", endpoint, {
			authorizationId,
			note: "Polling started — intermediate pending polls are suppressed",
		});
	}

	const startedAt = Date.now();
	const { data, error, response } = await client.GET(endpoint, {
		params: { path: { authorizationId } },
	});
	const durationMs = Date.now() - startedAt;

	if (error) {
		if (debugContext) {
			debugEmitters.vidosResponse(
				debugContext,
				"pollStatus",
				response?.status ?? 0,
				durationMs,
				false,
				undefined,
				error.message,
			);
		}
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

	// Only emit response debug event for non-pending (terminal or notable) statuses
	if (mappedStatus !== "pending" && debugContext) {
		debugEmitters.vidosResponse(
			debugContext,
			"pollStatus",
			response.status,
			durationMs,
			true,
			{ authorizationId, status: mappedStatus },
		);
	}

	// For rejected/error status, fetch detailed policy errors and emit policy_result
	if (mappedStatus === "rejected" || mappedStatus === "error") {
		const { errorInfo, policies } = await getPolicyErrors(authorizationId);

		if (debugContext) {
			debugEmitters.policyResult(
				debugContext,
				authorizationId,
				"direct_post_poll",
				mappedStatus,
				policies,
				errorInfo,
			);
		}

		return { status: mappedStatus, errorInfo };
	}

	// Emit policy_result for other terminal statuses too
	if (
		(mappedStatus === "authorized" || mappedStatus === "expired") &&
		debugContext
	) {
		const { errorInfo, policies } = await getPolicyErrors(authorizationId);
		debugEmitters.policyResult(
			debugContext,
			authorizationId,
			"direct_post_poll",
			mappedStatus,
			policies,
			errorInfo,
		);
	}

	return { status: mappedStatus };
}

/**
 * Forwards the DC API response to the Vidos Authorizer API for verification.
 * Used when the browser Digital Credentials API is used for verification.
 */
export async function forwardDCAPIResponse(
	params: ForwardDCAPIParams,
	debugContext?: DebugContext,
): Promise<ForwardDCAPIResult> {
	const { authorizationId, origin, dcResponse } = params;
	const client = getAuthorizerClient();

	const responseFormat: "jwt" | "vp_token" =
		"response" in dcResponse ? "jwt" : "vp_token";

	// Emit dc_api_forwarded event (shows the client→server→Vidos handoff)
	if (debugContext) {
		debugEmitters.dcApiForwarded(
			debugContext,
			authorizationId,
			origin,
			responseFormat,
		);
	}

	console.log("[Vidos] forwardDCAPIResponse:", authorizationId);

	// Determine which endpoint to use based on response format
	if ("response" in dcResponse) {
		const endpoint = "/openid4/vp/v1_0/{authorizationId}/dc_api.jwt" as const;

		if (debugContext) {
			debugEmitters.vidosRequest(
				debugContext,
				"forwardDCAPI",
				"POST",
				endpoint,
				{
					authorizationId,
					origin,
					responseFormat,
				},
			);
		}

		const startedAt = Date.now();
		const { data, error, response } = await client.POST(endpoint, {
			params: { path: { authorizationId } },
			body: {
				origin,
				digitalCredentialGetResponse: dcResponse,
			},
		});
		const durationMs = Date.now() - startedAt;

		if (error) {
			if (debugContext) {
				debugEmitters.vidosResponse(
					debugContext,
					"forwardDCAPI",
					response?.status ?? 0,
					durationMs,
					false,
					undefined,
					error.message,
				);
			}
			console.error("[Vidos] forwardDCAPIResponse error:", error);
			throw new Error(`Vidos API error: ${error.message}`);
		}

		if (!data) {
			throw new Error("Vidos API returned empty response");
		}

		const mappedStatus = data.status as AuthorizationStatus;
		console.log("[Vidos] forwardDCAPIResponse result:", mappedStatus);

		if (debugContext) {
			debugEmitters.vidosResponse(
				debugContext,
				"forwardDCAPI",
				response.status,
				durationMs,
				true,
				{ authorizationId, status: mappedStatus },
			);
		}

		// Fetch error info for rejected/error status, emit policy_result
		if (mappedStatus === "rejected" || mappedStatus === "error") {
			const { errorInfo, policies } = await getPolicyErrors(authorizationId);
			if (debugContext) {
				debugEmitters.policyResult(
					debugContext,
					authorizationId,
					"dc_api",
					mappedStatus,
					policies,
					errorInfo,
				);
			}
			return { status: mappedStatus, errorInfo };
		}

		if (debugContext && mappedStatus !== "pending") {
			const { errorInfo, policies } = await getPolicyErrors(authorizationId);
			debugEmitters.policyResult(
				debugContext,
				authorizationId,
				"dc_api",
				mappedStatus,
				policies,
				errorInfo,
			);
		}

		return { status: mappedStatus };
	}

	// vp_token response format
	const endpoint = "/openid4/vp/v1_0/{authorizationId}/dc_api" as const;

	if (debugContext) {
		debugEmitters.vidosRequest(debugContext, "forwardDCAPI", "POST", endpoint, {
			authorizationId,
			origin,
			responseFormat,
		});
	}

	const startedAt = Date.now();
	const { data, error, response } = await client.POST(endpoint, {
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
	});
	const durationMs = Date.now() - startedAt;

	if (error) {
		if (debugContext) {
			debugEmitters.vidosResponse(
				debugContext,
				"forwardDCAPI",
				response?.status ?? 0,
				durationMs,
				false,
				undefined,
				error.message,
			);
		}
		console.error("[Vidos] forwardDCAPIResponse error:", error);
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data) {
		throw new Error("Vidos API returned empty response");
	}

	const mappedStatus = data.status as AuthorizationStatus;
	console.log("[Vidos] forwardDCAPIResponse result:", mappedStatus);

	if (debugContext) {
		debugEmitters.vidosResponse(
			debugContext,
			"forwardDCAPI",
			response.status,
			durationMs,
			true,
			{ authorizationId, status: mappedStatus },
		);
	}

	// Fetch error info for rejected/error status, emit policy_result
	if (mappedStatus === "rejected" || mappedStatus === "error") {
		const { errorInfo, policies } = await getPolicyErrors(authorizationId);
		if (debugContext) {
			debugEmitters.policyResult(
				debugContext,
				authorizationId,
				"dc_api",
				mappedStatus,
				policies,
				errorInfo,
			);
		}
		return { status: mappedStatus, errorInfo };
	}

	if (debugContext && mappedStatus !== "pending") {
		const { errorInfo, policies } = await getPolicyErrors(authorizationId);
		debugEmitters.policyResult(
			debugContext,
			authorizationId,
			"dc_api",
			mappedStatus,
			policies,
			errorInfo,
		);
	}

	return { status: mappedStatus };
}

/**
 * Resolves a response_code to get the associated authorization ID and status.
 * The response_code is single-use and has a short TTL.
 * Throws on 404 (expired, already used, or non-existent code).
 */
export interface ResolveResponseCodeResult {
	authorizationId: string;
	status: "authorized" | "rejected" | "error" | "expired";
}

export async function resolveResponseCode(
	responseCode: string,
	debugContext?: DebugContext,
): Promise<ResolveResponseCodeResult> {
	const client = getAuthorizerClient();
	const endpoint = "/openid4/vp/v1_0/response-code/resolve" as const;

	console.log("[Vidos] resolveResponseCode:", `${responseCode.slice(0, 8)}...`);

	if (debugContext) {
		debugEmitters.vidosRequest(
			debugContext,
			"resolveResponseCode",
			"POST",
			endpoint,
			{ response_code: `${responseCode.slice(0, 8)}…` },
		);
	}

	const startedAt = Date.now();
	const { data, error, response } = await client.POST(endpoint, {
		body: { response_code: responseCode },
	});
	const durationMs = Date.now() - startedAt;

	if (error) {
		if (debugContext) {
			debugEmitters.vidosResponse(
				debugContext,
				"resolveResponseCode",
				response?.status ?? 0,
				durationMs,
				false,
				undefined,
				error.message,
			);
		}
		console.error("[Vidos] resolveResponseCode error:", error);
		if (response?.status === 404) {
			throw new Error("Response code not found, already used, or expired");
		}
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data) {
		throw new Error("Vidos API returned empty response");
	}

	if (debugContext) {
		debugEmitters.vidosResponse(
			debugContext,
			"resolveResponseCode",
			response.status,
			durationMs,
			true,
			{
				authorization_id: data.authorization_id,
				status: data.status,
			},
		);
	}

	console.log(
		"[Vidos] resolveResponseCode success:",
		data.authorization_id,
		"->",
		data.status,
	);

	return {
		authorizationId: data.authorization_id,
		status: data.status as ResolveResponseCodeResult["status"],
	};
}

export async function getExtractedCredentials<T extends z.ZodTypeAny>(
	authorizationId: string,
	schema: T,
	debugContext?: DebugContext,
	source?: "direct_post_poll" | "dc_api",
): Promise<z.infer<T>> {
	const client = getAuthorizerClient();
	const endpoint =
		"/openid4/vp/v1_0/authorizations/{authorizationId}/credentials" as const;

	console.log("[Vidos] getExtractedCredentials:", authorizationId);

	const startedAt = Date.now();
	const { data, error, response } = await client.GET(endpoint, {
		params: { path: { authorizationId } },
	});
	const durationMs = Date.now() - startedAt;

	if (error) {
		if (debugContext) {
			debugEmitters.vidosResponse(
				debugContext,
				"getCredentials",
				response?.status ?? 0,
				durationMs,
				false,
				undefined,
				error.message,
			);
		}
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

	if (debugContext) {
		debugEmitters.credentialResult(
			debugContext,
			authorizationId,
			source ?? "direct_post_poll",
			data as Record<string, unknown>,
			response.status,
			durationMs,
		);
	}

	return schema.parse(normalizePidClaims(claims));
}
