import { buildCarRentalMdlAuthorizationQuery } from "demo-car-rental-shared/lib/car-rental-verification";
import createClient from "openapi-fetch";
import type { paths } from "vidos-api/authorizer-api";

type CreateAuthorizationBody = NonNullable<
	paths["/openid4/vp/v1_0/authorizations"]["post"]["requestBody"]
>["content"]["application/json"];

type PolicyResponse =
	paths["/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response"]["get"]["responses"][200]["content"]["application/json"];

type CredentialsResponse =
	paths["/openid4/vp/v1_0/authorizations/{authorizationId}/credentials"]["get"]["responses"][200]["content"]["application/json"];

export type AuthorizerStatus =
	| "created"
	| "pending"
	| "pending_wallet"
	| "processing"
	| "authorized"
	| "completed"
	| "success"
	| "rejected"
	| "expired"
	| "error";

export type AuthorizerCredential = CredentialsResponse["credentials"][number];

export type AuthorizationSession = {
	authorizationId: string;
	authorizeUrl: string | null;
	expiresAt: string;
	nonce: string;
};

function getBaseUrl(): string {
	const url = process.env.VIDOS_AUTHORIZER_URL;
	if (!url) {
		throw new Error("Missing VIDOS_AUTHORIZER_URL");
	}
	return url;
}

function getApiKey(): string | undefined {
	return process.env.VIDOS_API_KEY;
}

function createClientInstance() {
	const headers: Record<string, string> = {
		"ngrok-skip-browser-warning": "true",
	};
	const apiKey = getApiKey();
	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
	}
	return createClient<paths>({ baseUrl: getBaseUrl(), headers });
}

function getErrorMessage(error: unknown): string {
	if (error && typeof error === "object" && "message" in error) {
		const message = (error as { message?: unknown }).message;
		if (typeof message === "string" && message.length > 0) {
			return message;
		}
	}
	return "Vidos API request failed";
}

export function buildMdlQuery(nonce: string): CreateAuthorizationBody {
	return buildCarRentalMdlAuthorizationQuery(
		nonce,
	) as unknown as CreateAuthorizationBody;
}

export async function createAuthorization(
	nonce: string,
): Promise<AuthorizationSession> {
	const client = createClientInstance();
	const { data, error } = await client.POST("/openid4/vp/v1_0/authorizations", {
		body: buildMdlQuery(nonce),
	});

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	return {
		authorizationId: data.authorizationId,
		authorizeUrl: "authorizeUrl" in data ? (data.authorizeUrl ?? null) : null,
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

	return data.status as AuthorizerStatus;
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
