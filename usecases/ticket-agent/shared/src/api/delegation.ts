import { z } from "zod";
import {
	delegatedCredentialStatusValueSchema,
	delegationScopeSchema,
	oid4vciOfferSchema,
} from "../types/delegation";

export const delegationIssueRequestSchema = z.object({
	scopes: z.array(delegationScopeSchema).min(1),
});

export type DelegationIssueRequest = z.infer<
	typeof delegationIssueRequestSchema
>;

export const delegationIssueResponseSchema = z.object({
	delegationId: z.string(),
	credentialOffer: oid4vciOfferSchema,
	credentialOfferUri: z.string().url(),
	credentialOfferDeepLink: z.string(),
	scopes: z.array(delegationScopeSchema),
	offerExpiresAt: z.string(),
	validUntil: z.string(),
});

export const delegationRevokeResponseSchema = z.object({
	delegationId: z.string(),
	revokedAt: z.string(),
});

export const delegationCredentialActionRequestSchema = z.object({
	delegationId: z.string(),
});

export const delegationSuspendResponseSchema = z.object({
	delegationId: z.string(),
	status: delegatedCredentialStatusValueSchema,
	suspendedAt: z.string(),
});

export const delegationReactivateResponseSchema = z.object({
	delegationId: z.string(),
	status: delegatedCredentialStatusValueSchema,
	reactivatedAt: z.string(),
});

export type DelegationIssueResponse = z.infer<
	typeof delegationIssueResponseSchema
>;

export type DelegationRevokeResponse = z.infer<
	typeof delegationRevokeResponseSchema
>;

export type DelegationCredentialActionRequest = z.infer<
	typeof delegationCredentialActionRequestSchema
>;

export type DelegationSuspendResponse = z.infer<
	typeof delegationSuspendResponseSchema
>;

export type DelegationReactivateResponse = z.infer<
	typeof delegationReactivateResponseSchema
>;
