import createClient from "openapi-fetch";
import type { AgeVerificationMethod } from "@/domain/verification/verification-types";
import type { paths } from "@/generated/authorizer-api";

type CreateAuthorizationBody = NonNullable<
	paths["/openid4/vp/v1_0/authorizations"]["post"]["requestBody"]
>["content"]["application/json"];

type CreateAuthorizationResponse =
	paths["/openid4/vp/v1_0/authorizations"]["post"]["responses"][201]["content"]["application/json"];

type AuthorizationStatusResponse =
	paths["/openid4/vp/v1_0/authorizations/{authorizationId}/status"]["get"]["responses"][200]["content"]["application/json"];

type PolicyResponse =
	paths["/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response"]["get"]["responses"][200]["content"]["application/json"];

type CredentialsResponse =
	paths["/openid4/vp/v1_0/authorizations/{authorizationId}/credentials"]["get"]["responses"][200]["content"]["application/json"];

export type AuthorizerStatus = AuthorizationStatusResponse["status"];
export type AuthorizerCredential = CredentialsResponse["credentials"][number];

export type AuthorizerAuthorizationSession = {
	authorizationId: string;
	authorizeUrl: string | null;
	expiresAt: string;
	nonce: string;
};

const PID_CREDENTIAL_PREFIX = "age";

export function getAuthorizerBaseUrl(): string | null {
	const raw = import.meta.env.VITE_WINE_SHOP_AUTHORIZER_URL;
	if (typeof raw !== "string") return null;
	const value = raw.trim();
	return value.length > 0 ? value : null;
}

export function getAuthorizerClientConfigError(): string {
	return "Missing Vidos Authorizer configuration. Set VITE_WINE_SHOP_AUTHORIZER_URL.";
}

function getErrorMessage(error: unknown): string {
	if (error && typeof error === "object" && "message" in error) {
		const message = (error as { message?: unknown }).message;
		if (typeof message === "string" && message.length > 0) return message;
	}
	return "Authorizer API request failed";
}

function createAuthorizerClient(baseUrl: string, apiKey?: string) {
	const headers: Record<string, string> = {};
	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
	}
	headers["ngrok-skip-browser-warning"] = "true";
	return createClient<paths>({ baseUrl, headers });
}

function buildCreateAuthorizationBody(
	nonce: string,
	requiredAge: number,
	ageVerificationMethod: AgeVerificationMethod,
): CreateAuthorizationBody {
	const minimumAgePath = String(requiredAge);
	const credentialId = `${PID_CREDENTIAL_PREFIX}-${minimumAgePath}-pid-cred`;

	let claimPath: (string | number)[];
	switch (ageVerificationMethod) {
		case "age_equal_or_over":
			claimPath = ["age_equal_or_over", minimumAgePath];
			break;
		case "age_in_years":
			claimPath = ["age_in_years"];
			break;
		case "birthdate":
			claimPath = ["birthdate"];
			break;
	}

	return {
		nonce,
		responseMode: "direct_post.jwt",
		query: {
			type: "DCQL",
			dcql: {
				id: `wine-shop-${nonce.slice(0, 12)}`,
				purpose: "Verify age eligibility for wine purchase",
				credentials: [
					{
						id: credentialId,
						format: "dc+sd-jwt",
						meta: {
							vct_values: ["urn:eudi:pid:1"],
						},
						claims: [{ path: claimPath }],
					},
				],
			},
		},
	} satisfies CreateAuthorizationBody;
}

function toAuthorizeUrl(response: CreateAuthorizationResponse): string | null {
	if ("authorizeUrl" in response && typeof response.authorizeUrl === "string") {
		return response.authorizeUrl;
	}
	return null;
}

export async function createAuthorizerAuthorization(input: {
	baseUrl: string;
	apiKey?: string;
	nonce: string;
	requiredAge: number;
	ageVerificationMethod: AgeVerificationMethod;
}): Promise<AuthorizerAuthorizationSession> {
	const client = createAuthorizerClient(input.baseUrl, input.apiKey);
	const { data, error } = await client.POST("/openid4/vp/v1_0/authorizations", {
		body: buildCreateAuthorizationBody(
			input.nonce,
			input.requiredAge,
			input.ageVerificationMethod,
		),
	});

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	return {
		authorizationId: data.authorizationId,
		authorizeUrl: toAuthorizeUrl(data),
		expiresAt: data.expiresAt,
		nonce: data.nonce,
	};
}

export async function getAuthorizerAuthorizationStatus(input: {
	baseUrl: string;
	apiKey?: string;
	authorizationId: string;
}): Promise<AuthorizerStatus> {
	const client = createAuthorizerClient(input.baseUrl, input.apiKey);
	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/status",
		{ params: { path: { authorizationId: input.authorizationId } } },
	);

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	return data.status;
}

export async function getAuthorizerPolicyResponse(input: {
	baseUrl: string;
	apiKey?: string;
	authorizationId: string;
}): Promise<PolicyResponse["data"]> {
	const client = createAuthorizerClient(input.baseUrl, input.apiKey);
	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response",
		{ params: { path: { authorizationId: input.authorizationId } } },
	);

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	return data.data;
}

export async function getAuthorizerCredentials(input: {
	baseUrl: string;
	apiKey?: string;
	authorizationId: string;
}): Promise<CredentialsResponse["credentials"]> {
	const client = createAuthorizerClient(input.baseUrl, input.apiKey);
	const { data, error } = await client.GET(
		"/openid4/vp/v1_0/authorizations/{authorizationId}/credentials",
		{ params: { path: { authorizationId: input.authorizationId } } },
	);

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	return data.credentials;
}
