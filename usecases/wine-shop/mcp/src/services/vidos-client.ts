import {
	buildWinePurchaseAuthorizationBody,
	type SharedAuthorizerStatus,
} from "demo-wine-shop-shared/lib/wine-verification";
import createClient from "openapi-fetch";
import type { paths } from "vidos-api/authorizer-api";

export type AuthorizerStatus = SharedAuthorizerStatus;

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

export async function createAuthorization(): Promise<AuthorizationSession> {
	const client = createClientInstance();
	const { data, error } = await client.POST("/openid4/vp/v1_0/authorizations", {
		body: buildWinePurchaseAuthorizationBody({
			requiredAge: 18,
			ageVerificationMethod: "birthdate",
			purpose: "Verify buyer is 18 or older for wine purchase",
			queryId: "wine-checkout-pid",
			requireHolderBinding: true,
		}),
	});

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	const result = data as {
		authorizationId: string;
		authorizeUrl?: string;
		expiresAt: string;
		nonce: string;
	};

	return {
		authorizationId: result.authorizationId,
		authorizeUrl: result.authorizeUrl ?? null,
		expiresAt: result.expiresAt,
		nonce: result.nonce,
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

	const status = data.status;
	if (status === "pending") {
		return "pending_wallet";
	}
	return status as AuthorizerStatus;
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
