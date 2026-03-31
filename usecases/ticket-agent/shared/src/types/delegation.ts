import { z } from "zod";

export const DELEGATION_VCT = "urn:vidos:agent-delegation:1" as const;

export const delegationScopeSchema = z.enum(["book_tickets"]);

export type DelegationScope = z.infer<typeof delegationScopeSchema>;

export const delegationClaimsSchema = z.object({
	delegation_id: z.string(),
	agent_name: z.string().default("Unnamed Agent"),
	given_name: z.string(),
	family_name: z.string(),
	birth_date: z.string(),
	delegation_scopes: z.array(delegationScopeSchema).min(1),
	valid_until: z.string(),
});

export type DelegationClaims = z.infer<typeof delegationClaimsSchema>;

export const delegationSessionStatusSchema = z.enum([
	"offer_created",
	"credential_received",
	"suspended",
	"revoked",
]);

export const delegationDisplayStateSchema = z.enum([
	"offer_ready",
	"offer_redeeming",
	"offer_expired",
	"credential_active",
	"credential_suspended",
	"credential_revoked",
]);

export const delegatedCredentialStatusValueSchema = z.enum([
	"active",
	"suspended",
	"revoked",
]);

export type DelegationSessionStatus = z.infer<
	typeof delegationSessionStatusSchema
>;

export type DelegationDisplayState = z.infer<
	typeof delegationDisplayStateSchema
>;

export type DelegatedCredentialStatusValue = z.infer<
	typeof delegatedCredentialStatusValueSchema
>;

export const oid4vciOfferSchema = z.object({
	credential_issuer: z.string().url(),
	credential_configuration_ids: z.array(z.string()).min(1).max(1),
	grants: z.object({
		"urn:ietf:params:oauth:grant-type:pre-authorized_code": z.object({
			"pre-authorized_code": z.string(),
		}),
	}),
});

export type Oid4vciOffer = z.infer<typeof oid4vciOfferSchema>;

export interface DelegationSession {
	id: string;
	userId: string;
	status: DelegationSessionStatus;
	agentName: string;
	verifiedClaims: DelegationClaims | null;
	scopes: DelegationScope[];
	validUntil: string | null;
	offer: Oid4vciOffer | null;
	offerUri: string | null;
	preAuthorizedCode: string | null;
	preAuthorizedCodeExpiresAt: string | null;
	preAuthorizedCodeUsedAt: string | null;
	accessToken: string | null;
	accessTokenExpiresAt: string | null;
	accessTokenUsedAt: string | null;
	lastNonce: string | null;
	lastNonceExpiresAt: string | null;
	lastNonceUsedAt: string | null;
	holderPublicKey: Record<string, unknown> | null;
	credentialStatus: {
		status_list: {
			idx: number;
			uri: string;
		};
	} | null;
	credentialRevokedAt: string | null;
	credentialSuspendedAt: string | null;
	credentialIssuedAt: string | null;
	createdAt: string;
}

export interface DelegatedCredentialSummary {
	delegationId: string;
	state: DelegationDisplayState;
	status: DelegatedCredentialStatusValue | null;
	agentName: string;
	scopes: DelegationScope[];
	validUntil: string | null;
	offerExpiresAt: string | null;
	offerRedeemedAt: string | null;
	credentialIssuedAt: string | null;
	credentialSuspendedAt: string | null;
	credentialRevokedAt: string | null;
	credentialOfferUri: string | null;
	credentialOfferDeepLink: string | null;
	credentialStatus: {
		status_list: {
			idx: number;
			uri: string;
		};
	} | null;
	holderPublicKey: Record<string, unknown> | null;
}
