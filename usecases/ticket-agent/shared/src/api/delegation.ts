import { z } from "zod";
import { delegationScopeSchema, oid4vciOfferSchema } from "../types/delegation";

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
	validUntil: z.string(),
});

export type DelegationIssueResponse = z.infer<
	typeof delegationIssueResponseSchema
>;
