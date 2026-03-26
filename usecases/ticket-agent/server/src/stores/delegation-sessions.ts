import { and, eq, ne } from "drizzle-orm";
import type {
	DelegationClaims,
	DelegationScope,
} from "ticket-agent-shared/types/delegation";
import { db } from "../db";
import { delegationSessions } from "../db/schema";

export function createDelegationSession(data: {
	id: string;
	userId: string;
	authorizationId: string;
}) {
	const now = new Date().toISOString();
	return db
		.insert(delegationSessions)
		.values({
			id: data.id,
			userId: data.userId,
			status: "pending_verification",
			authorizationId: data.authorizationId,
			createdAt: now,
		})
		.returning()
		.get();
}

export function getDelegationSessionById(id: string) {
	return db
		.select()
		.from(delegationSessions)
		.where(eq(delegationSessions.id, id))
		.get();
}

export function getActiveDelegationSessionByUserId(userId: string) {
	return db
		.select()
		.from(delegationSessions)
		.where(
			and(
				eq(delegationSessions.userId, userId),
				ne(delegationSessions.status, "revoked"),
			),
		)
		.get();
}

export function updateDelegationSessionVerified(
	id: string,
	claims: DelegationClaims,
) {
	return db
		.update(delegationSessions)
		.set({
			status: "verified",
			verifiedClaims: claims as unknown as Record<string, unknown>,
		})
		.where(eq(delegationSessions.id, id))
		.returning()
		.get();
}

export function updateDelegationSessionCredentialIssued(
	id: string,
	data: {
		agentPublicKey: Record<string, unknown>;
		scopes: DelegationScope[];
		issuedCredential: string;
	},
) {
	return db
		.update(delegationSessions)
		.set({
			status: "credential_issued",
			agentPublicKey: data.agentPublicKey,
			scopes: data.scopes as unknown as string[],
			issuedCredential: data.issuedCredential,
		})
		.where(eq(delegationSessions.id, id))
		.returning()
		.get();
}

export function revokePreviousDelegationSessions(
	userId: string,
	excludeId: string,
) {
	return db
		.update(delegationSessions)
		.set({ status: "revoked" })
		.where(
			and(
				eq(delegationSessions.userId, userId),
				ne(delegationSessions.id, excludeId),
				ne(delegationSessions.status, "revoked"),
			),
		)
		.run();
}

export function isDelegationSessionRevoked(id: string): boolean {
	const session = getDelegationSessionById(id);
	return session?.status === "revoked";
}
