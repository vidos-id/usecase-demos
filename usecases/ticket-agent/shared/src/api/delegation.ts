import { z } from "zod";
import { delegationScopeSchema } from "../types/delegation";

export const delegationIssueRequestSchema = z.object({
	agentPublicKey: z.record(z.string(), z.unknown()),
	scopes: z.array(delegationScopeSchema).min(1),
});

export type DelegationIssueRequest = z.infer<
	typeof delegationIssueRequestSchema
>;

export const delegationIssueResponseSchema = z.object({
	credential: z.string(),
	delegatorName: z.string(),
	scopes: z.array(delegationScopeSchema),
	validUntil: z.string(),
});

export type DelegationIssueResponse = z.infer<
	typeof delegationIssueResponseSchema
>;
