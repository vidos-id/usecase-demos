import { z } from "zod";

export const DELEGATION_VCT = "urn:vidos:agent-delegation:1" as const;

export const delegationScopeSchema = z.enum([
	"browse_events",
	"purchase_tickets",
	"manage_bookings",
]);

export type DelegationScope = z.infer<typeof delegationScopeSchema>;

export const delegationClaimsSchema = z.object({
	given_name: z.string(),
	family_name: z.string(),
	birth_date: z.string(),
	delegation_scopes: z.array(delegationScopeSchema).min(1),
	valid_until: z.string(),
});

export type DelegationClaims = z.infer<typeof delegationClaimsSchema>;

export const delegationSessionStatusSchema = z.enum([
	"pending_verification",
	"verified",
	"credential_issued",
	"revoked",
]);

export type DelegationSessionStatus = z.infer<
	typeof delegationSessionStatusSchema
>;

export interface DelegationSession {
	id: string;
	userId: string;
	status: DelegationSessionStatus;
	authorizationId: string | null;
	verifiedClaims: DelegationClaims | null;
	agentPublicKey: Record<string, unknown> | null;
	scopes: DelegationScope[];
	issuedCredential: string | null;
	createdAt: string;
}
