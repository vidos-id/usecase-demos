import createClient from "openapi-fetch";
import {
	MDL_CREDENTIAL_ID,
	MDL_DOC_TYPE,
	MDL_NAMESPACE,
} from "@/domain/verification/verification-constants";
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

export function getAuthorizerBaseUrl(): string | null {
	const raw = import.meta.env.VIDOS_CAR_RENTAL_AUTHORIZER_URL;
	if (typeof raw !== "string") {
		return null;
	}

	const value = raw.trim();
	return value.length > 0 ? value : null;
}

export function getAuthorizerClientConfigError(): string {
	return "Missing Vidos Authorizer configuration. Set VIDOS_CAR_RENTAL_AUTHORIZER_URL.";
}

function getErrorMessage(error: unknown): string {
	if (error && typeof error === "object" && "message" in error) {
		const message = (error as { message?: unknown }).message;
		if (typeof message === "string" && message.length > 0) {
			return message;
		}
	}

	return "Authorizer API request failed";
}

function createAuthorizerClient(baseUrl: string, apiKey?: string) {
	const headers: Record<string, string> = {};
	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
	}
	headers["ngrok-skip-browser-warning"] = "true";
	return createClient<paths>({
		baseUrl,
		headers,
	});
}

function buildCreateAuthorizationBody(nonce: string): CreateAuthorizationBody {
	const body = {
		nonce,
		responseMode: "direct_post.jwt",
		query: {
			type: "DCQL",
			dcql: {
				id: `car-rental-${nonce.slice(0, 12)}`,
				purpose: "Verify driving licence eligibility for rental release",
				credentials: [
					{
						id: MDL_CREDENTIAL_ID,
						format: "mso_mdoc",
						meta: {
							doctype_value: MDL_DOC_TYPE,
						},
						claims: [
							{ path: [MDL_NAMESPACE, "given_name"] },
							{ path: [MDL_NAMESPACE, "family_name"] },
							{ path: [MDL_NAMESPACE, "birth_date"] },
							{ path: [MDL_NAMESPACE, "document_number"] },
							{ path: [MDL_NAMESPACE, "expiry_date"] },
							{ path: [MDL_NAMESPACE, "driving_privileges"] },
							{ path: [MDL_NAMESPACE, "portrait"] },
						],
					},
				],
			},
		},
	} satisfies CreateAuthorizationBody;

	return body;
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
}): Promise<AuthorizerAuthorizationSession> {
	const client = createAuthorizerClient(input.baseUrl, input.apiKey);
	const { data, error } = await client.POST("/openid4/vp/v1_0/authorizations", {
		body: buildCreateAuthorizationBody(input.nonce),
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
		{
			params: {
				path: {
					authorizationId: input.authorizationId,
				},
			},
		},
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
		{
			params: {
				path: {
					authorizationId: input.authorizationId,
				},
			},
		},
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
		{
			params: {
				path: {
					authorizationId: input.authorizationId,
				},
			},
		},
	);

	if (error || !data) {
		throw new Error(getErrorMessage(error));
	}

	return data.credentials;
}
