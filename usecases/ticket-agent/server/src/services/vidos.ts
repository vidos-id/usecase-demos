import createClient from "openapi-fetch";
import type { paths } from "vidos-api/authorizer-api";
import type { z } from "zod";
import { env } from "../env";

const PID_SDJWT_VCT = "urn:eudi:pid:1";
const DELEGATION_VCT = "urn:vidos:agent-delegation:1";

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

export type PolicyResponseEntry =
	paths["/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response"]["get"]["responses"][200]["content"]["application/json"]["data"][number];

export type ExtractedCredential =
	paths["/openid4/vp/v1_0/authorizations/{authorizationId}/credentials"]["get"]["responses"][200]["content"]["application/json"]["credentials"][number];

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

function getNonEmptyString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function summarizePolicyResult(result: PolicyResponseEntry) {
	const error =
		result.error && typeof result.error === "object"
			? {
					type:
						"type" in result.error
							? getNonEmptyString(result.error.type)
							: undefined,
					title:
						"title" in result.error
							? getNonEmptyString(result.error.title)
							: undefined,
					detail:
						"detail" in result.error
							? getNonEmptyString(result.error.detail)
							: undefined,
					vidosType:
						"vidosType" in result.error
							? getNonEmptyString(result.error.vidosType)
							: undefined,
				}
			: undefined;

	return {
		path: result.path,
		policy: result.policy,
		service: result.service,
		hasError: Boolean(error),
		error,
		dataKeys:
			result.data && typeof result.data === "object"
				? Object.keys(result.data as Record<string, unknown>)
				: undefined,
	};
}

function logPolicyResponseOverview(
	authorizationId: string,
	policyResults: PolicyResponseEntry[],
): void {
	console.log("[Vidos] policy results overview:", {
		authorizationId,
		count: policyResults.length,
		results: policyResults.map(summarizePolicyResult),
	});
}

function logCredentialsOverview(
	authorizationId: string,
	credentials: ExtractedCredential[],
): void {
	console.log("[Vidos] credentials received:", {
		authorizationId,
		count: credentials.length,
		credentials: credentials.map((credential) => ({
			path: credential.path,
			format: credential.format,
			credentialType: credential.credentialType,
			claims: credential.claims,
		})),
	});
}

export async function fetchAuthorizationPolicyResponse(
	authorizationId: string,
): Promise<PolicyResponseEntry[]> {
	const client = getAuthorizerClient();

	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response",
		{
			params: { path: { authorizationId } },
		},
	);

	if (error) {
		console.error("[Vidos] getPolicyResponse error:", authorizationId, error);
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data?.data) {
		console.warn(
			"[Vidos] getPolicyResponse returned no policy data:",
			authorizationId,
		);
		return [];
	}

	logPolicyResponseOverview(authorizationId, data.data);

	return data.data;
}

export async function fetchAuthorizationCredentials(
	authorizationId: string,
): Promise<ExtractedCredential[]> {
	const client = getAuthorizerClient();

	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/credentials",
		{
			params: { path: { authorizationId } },
		},
	);

	if (error) {
		console.error(
			"[Vidos] getExtractedCredentials error:",
			authorizationId,
			error,
		);
		throw new Error(`Vidos API error: ${error.message}`);
	}

	const credentials = data?.credentials ?? [];
	logCredentialsOverview(authorizationId, credentials);

	return credentials;
}

export async function getAuthorizationInspectionDetails(
	authorizationId: string,
): Promise<{
	policyResults: PolicyResponseEntry[];
	credentials: ExtractedCredential[];
}> {
	const [policyResults, credentials] = await Promise.all([
		fetchAuthorizationPolicyResponse(authorizationId),
		fetchAuthorizationCredentials(authorizationId),
	]);

	return {
		policyResults,
		credentials,
	};
}

export async function createPIDAuthorizationRequest(): Promise<{
	authorizationId: string;
	authorizeUrl: string;
}> {
	const client = getAuthorizerClient();

	const dcqlQuery = {
		credentials: [
			{
				id: "pid_sd_jwt",
				format: "dc+sd-jwt",
				meta: { vct_values: [PID_SDJWT_VCT] },
				require_cryptographic_holder_binding: true,
				claims: [
					{ path: ["family_name"] },
					{ path: ["given_name"] },
					{ path: ["birthdate"] },
				],
			},
		],
	};

	const { data, error } = await client.POST("/openid4/vp/v1_0/authorizations", {
		body: {
			query: { type: "DCQL", dcql: dcqlQuery },
			responseMode: "direct_post.jwt",
		},
	});

	if (error) {
		console.error("[Vidos] createPIDAuthorizationRequest error:", error);
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data || !("authorizeUrl" in data)) {
		throw new Error("Vidos API returned unexpected response format");
	}

	console.log("[Vidos] PID authorization created:", data.authorizationId);

	return {
		authorizationId: data.authorizationId,
		authorizeUrl: data.authorizeUrl,
	};
}

export async function createDelegationAuthorizationRequest(): Promise<{
	authorizationId: string;
	authorizeUrl: string;
}> {
	const client = getAuthorizerClient();

	const dcqlQuery = {
		purpose: "Verify delegation credential for ticket purchase",
		credentials: [
			{
				id: "delegation_sd_jwt",
				format: "dc+sd-jwt",
				meta: { vct_values: [DELEGATION_VCT] },
				claims: [
					{ path: ["delegation_id"] },
					{ path: ["agent_name"] },
					{ path: ["given_name"] },
					{ path: ["family_name"] },
					{ path: ["birth_date"] },
					{ path: ["delegation_scopes"] },
					{ path: ["valid_until"] },
				],
			},
		],
	};

	const { data, error } = await client.POST("/openid4/vp/v1_0/authorizations", {
		body: {
			query: { type: "DCQL", dcql: dcqlQuery },
			responseMode: "direct_post.jwt",
		},
	});

	if (error) {
		console.error("[Vidos] createDelegationAuthorizationRequest error:", error);
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data || !("authorizeUrl" in data)) {
		throw new Error("Vidos API returned unexpected response format");
	}

	console.log(
		"[Vidos] Delegation authorization created:",
		data.authorizationId,
	);

	return {
		authorizationId: data.authorizationId,
		authorizeUrl: data.authorizeUrl,
	};
}

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
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data) {
		throw new Error("Vidos API returned empty response");
	}

	const mappedStatus =
		data.status === "created"
			? "pending"
			: (data.status as AuthorizationStatus);

	console.log("[Vidos] pollAuthorizationStatus:", {
		authorizationId,
		status: mappedStatus,
	});

	if (mappedStatus === "rejected" || mappedStatus === "error") {
		const [policyResults, credentialsResult] = await Promise.allSettled([
			fetchAuthorizationPolicyResponse(authorizationId),
			fetchAuthorizationCredentials(authorizationId),
		]);

		if (policyResults.status === "rejected") {
			console.error(
				"[Vidos] Failed to load policy results for rejected authorization:",
				authorizationId,
				policyResults.reason,
			);
		}

		if (credentialsResult.status === "rejected") {
			console.error(
				"[Vidos] Failed to load credentials for rejected authorization:",
				authorizationId,
				credentialsResult.reason,
			);
		}
	}

	return {
		status: mappedStatus,
		error:
			typeof data === "object" && data && "error" in data
				? getNonEmptyString(data.error)
				: undefined,
	};
}

export async function getExtractedCredentials<T extends z.ZodTypeAny>(
	authorizationId: string,
	schema: T,
): Promise<z.infer<T>> {
	const credentials = await fetchAuthorizationCredentials(authorizationId);

	if (credentials.length === 0) {
		throw new Error("No credentials found in authorization");
	}

	const credential = credentials[0];
	if (!credential) {
		throw new Error("No credentials found in authorization");
	}

	const claims = credential.claims as Record<string, unknown>;

	console.log("[Vidos] extracted claims:", Object.keys(claims));

	return schema.parse(claims);
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
