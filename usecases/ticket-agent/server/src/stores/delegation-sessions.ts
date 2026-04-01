import { and, eq, ne, or } from "drizzle-orm";
import type {
	DelegationClaims,
	DelegationScope,
	Oid4vciOffer,
} from "ticket-agent-shared/types/delegation";
import { db } from "../db";
import { delegationSessions } from "../db/schema";

export function createDelegationSession(data: {
	id: string;
	userId: string;
	agentName: string;
	scopes: DelegationScope[];
	verifiedClaims: DelegationClaims;
	validUntil: string;
	offer: Oid4vciOffer;
	offerUri: string;
	preAuthorizedCode: string;
	preAuthorizedCodeExpiresAt: string;
}) {
	const now = new Date().toISOString();
	return db
		.insert(delegationSessions)
		.values({
			id: data.id,
			userId: data.userId,
			status: "offer_created",
			agentName: data.agentName,
			verifiedClaims: data.verifiedClaims as unknown as Record<string, unknown>,
			scopes: data.scopes as unknown as string[],
			validUntil: data.validUntil,
			offer: data.offer as unknown as Record<string, unknown>,
			offerUri: data.offerUri,
			preAuthorizedCode: data.preAuthorizedCode,
			preAuthorizedCodeExpiresAt: data.preAuthorizedCodeExpiresAt,
			credentialStatus: null,
			credentialActivatedAt: null,
			credentialSuspendedAt: null,
			credentialRevokedAt: null,
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

export function getDelegationSessionsByUserId(userId: string) {
	return db
		.select()
		.from(delegationSessions)
		.where(eq(delegationSessions.userId, userId))
		.orderBy(delegationSessions.createdAt)
		.all();
}

export function getDelegationSessionByPreAuthorizedCode(
	preAuthorizedCode: string,
) {
	return db
		.select()
		.from(delegationSessions)
		.where(eq(delegationSessions.preAuthorizedCode, preAuthorizedCode))
		.get();
}

export function getDelegationSessionByAccessToken(accessToken: string) {
	return db
		.select()
		.from(delegationSessions)
		.where(eq(delegationSessions.accessToken, accessToken))
		.get();
}

export function getDelegationSessionByNonce(cNonce: string) {
	return db
		.select()
		.from(delegationSessions)
		.where(eq(delegationSessions.lastNonce, cNonce))
		.get();
}

export function markDelegationOfferUsed(
	id: string,
	data: {
		accessToken: string;
		accessTokenExpiresAt: string;
		preAuthorizedCodeUsedAt: string;
	},
) {
	return db
		.update(delegationSessions)
		.set({
			accessToken: data.accessToken,
			accessTokenExpiresAt: data.accessTokenExpiresAt,
			preAuthorizedCodeUsedAt: data.preAuthorizedCodeUsedAt,
		})
		.where(eq(delegationSessions.id, id))
		.returning()
		.get();
}

export function updateDelegationSessionNonce(
	id: string,
	data: {
		lastNonce: string;
		lastNonceExpiresAt: string;
	},
) {
	return db
		.update(delegationSessions)
		.set({
			lastNonce: data.lastNonce,
			lastNonceExpiresAt: data.lastNonceExpiresAt,
			lastNonceUsedAt: null,
		})
		.where(eq(delegationSessions.id, id))
		.returning()
		.get();
}

export function markDelegationCredentialReceived(
	id: string,
	data: {
		holderPublicKey: Record<string, unknown>;
		credentialStatus: Record<string, unknown>;
		accessTokenUsedAt: string;
		lastNonceUsedAt: string;
		credentialIssuedAt: string;
	},
) {
	return db
		.update(delegationSessions)
		.set({
			status: "credential_received",
			holderPublicKey: data.holderPublicKey,
			credentialStatus: data.credentialStatus,
			credentialActivatedAt: data.credentialIssuedAt,
			credentialSuspendedAt: null,
			credentialRevokedAt: null,
			accessTokenUsedAt: data.accessTokenUsedAt,
			lastNonceUsedAt: data.lastNonceUsedAt,
			credentialIssuedAt: data.credentialIssuedAt,
		})
		.where(eq(delegationSessions.id, id))
		.returning()
		.get();
}

export function revokeDelegationSession(id: string, revokedAt: string) {
	return db
		.update(delegationSessions)
		.set({
			status: "revoked",
			credentialRevokedAt: revokedAt,
		})
		.where(eq(delegationSessions.id, id))
		.returning()
		.get();
}

export function suspendDelegationSession(id: string, suspendedAt: string) {
	return db
		.update(delegationSessions)
		.set({
			status: "suspended",
			credentialSuspendedAt: suspendedAt,
		})
		.where(eq(delegationSessions.id, id))
		.returning()
		.get();
}

export function reactivateDelegationSession(id: string, activatedAt: string) {
	return db
		.update(delegationSessions)
		.set({
			status: "credential_received",
			credentialActivatedAt: activatedAt,
			credentialSuspendedAt: null,
		})
		.where(eq(delegationSessions.id, id))
		.returning()
		.get();
}

export function isDelegationSessionRevoked(id: string): boolean {
	const session = getDelegationSessionById(id);
	return session?.status === "revoked";
}

export function isDelegationSessionSuspended(id: string): boolean {
	const session = getDelegationSessionById(id);
	return session?.status === "suspended";
}

export function getLatestDelegationSessionAwaitingCredential() {
	const sessions = db
		.select()
		.from(delegationSessions)
		.where(
			and(
				eq(delegationSessions.status, "offer_created"),
				ne(delegationSessions.status, "revoked"),
			),
		)
		.orderBy(delegationSessions.createdAt)
		.all();

	return sessions[sessions.length - 1];
}

export function getLatestDelegationSessionByUserId(userId: string) {
	const sessions = getDelegationSessionsByUserId(userId);

	return sessions[sessions.length - 1];
}
