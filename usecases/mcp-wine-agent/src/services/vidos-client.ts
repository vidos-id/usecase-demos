import createClient from "openapi-fetch";
import type { paths } from "./authorizer-api";

export type AuthorizerStatus =
	| "created"
	| "pending_wallet"
	| "processing"
	| "authorized"
	| "completed"
	| "success"
	| "rejected"
	| "expired"
	| "error";

export type AuthorizerCredential = {
	id: string;
	format: string;
	claims: Record<string, unknown>;
};

export type AuthorizationSession = {
	authorizationId: string;
	authorizeUrl: string | null;
	expiresAt: string;
	nonce: string;
};

type CreateAuthorizationBody = NonNullable<
	paths["/openid4/vp/v1_0/authorizations"]["post"]["requestBody"]
>["content"]["application/json"];

type PolicyResponse =
	paths["/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response"]["get"]["responses"][200]["content"]["application/json"];

type CredentialsResponse =
	paths["/openid4/vp/v1_0/authorizations/{authorizationId}/credentials"]["get"]["responses"][200]["content"]["application/json"];

function getBaseUrl(): string {
	const url = process.env.VIDOS_AUTHORIZER_URL;
	if (!url) {
		throw new Error("Missing VIDOS_AUTHORIZER_URL environment variable");
	}
	return url;
}

function getApiKey(): string | undefined {
	return process.env.VIDOS_API_KEY;
}

function createClientInstance() {
	const headers: Record<string, string> = {};
	const apiKey = getApiKey();
	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
	}
	return createClient<paths>({ baseUrl: getBaseUrl(), headers });
}

function getErrorMessage(error: unknown): string {
	if (error && typeof error === "object" && "message" in error) {
		const message = (error as { message?: unknown }).message;
		if (typeof message === "string" && message.length > 0) return message;
	}
	return "Vidos API request failed";
}

export function buildDcqlPidQuery(): CreateAuthorizationBody {
	const credentialRequest = {
		id: "age-18-pid-cred",
		format: "dc+sd-jwt",
		meta: {
			vct_values: ["urn:eudi:pid:1"],
		},
		require_cryptographic_holder_binding: true,
		claims: [{ path: ["age_equal_or_over", "18"] }],
	} as CreateAuthorizationBody["query"]["dcql"]["credentials"][number] & {
		require_cryptographic_holder_binding: boolean;
	};

	return {
		responseMode: "direct_post.jwt",
		query: {
			type: "DCQL",
			dcql: {
				id: "wine-checkout-pid",
				purpose: "Verify buyer is 18 or older for wine purchase",
				credentials: [credentialRequest],
			},
		},
	};
}

export async function createAuthorization(): Promise<AuthorizationSession> {
	const client = createClientInstance();
	const { data, error } = await client.POST("/openid4/vp/v1_0/authorizations", {
		body: buildDcqlPidQuery(),
	});

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	return {
		authorizationId: data.authorizationId,
		authorizeUrl: data.authorizeUrl ?? null,
		expiresAt: data.expiresAt,
		nonce: data.nonce,
	};
}

export async function getAuthorizationStatus(
	authorizationId: string,
): Promise<AuthorizerStatus> {
	const client = createClientInstance();
	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/status",
		{ params: { path: { authorizationId } } },
	);

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	return data.status;
}

export async function getPolicyResponse(
	authorizationId: string,
): Promise<PolicyResponse["data"]> {
	const client = createClientInstance();
	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response",
		{ params: { path: { authorizationId } } },
	);

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	return data.data;
}

export async function getCredentials(
	authorizationId: string,
): Promise<CredentialsResponse["credentials"]> {
	const client = createClientInstance();
	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/credentials",
		{ params: { path: { authorizationId } } },
	);

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	return data.credentials;
}
