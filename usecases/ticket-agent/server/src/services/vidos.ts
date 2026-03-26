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
	const client = getAuthorizerClient();

	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/credentials",
		{
			params: { path: { authorizationId } },
		},
	);

	if (error) {
		console.error("[Vidos] getExtractedCredentials error:", error);
		throw new Error(`Vidos API error: ${error.message}`);
	}

	if (!data?.credentials || data.credentials.length === 0) {
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

export async function vidosAuthorizerHealthCheck(): Promise<boolean> {
	const client = getAuthorizerClient();
	const { error, response } = await client.GET("/health", {});

	if (error) {
		console.error("Health check failed:", error);
		return false;
	}

	return response.status === 204;
}
