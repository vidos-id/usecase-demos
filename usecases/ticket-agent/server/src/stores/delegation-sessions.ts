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
			verifiedClaims: data.verifiedClaims as unknown as Record<string, unknown>,
			scopes: data.scopes as unknown as string[],
			validUntil: data.validUntil,
			offer: data.offer as unknown as Record<string, unknown>,
			offerUri: data.offerUri,
			preAuthorizedCode: data.preAuthorizedCode,
			preAuthorizedCodeExpiresAt: data.preAuthorizedCodeExpiresAt,
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
			accessTokenUsedAt: data.accessTokenUsedAt,
			lastNonceUsedAt: data.lastNonceUsedAt,
			credentialIssuedAt: data.credentialIssuedAt,
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
	const sessions = db
		.select()
		.from(delegationSessions)
		.where(
			and(
				eq(delegationSessions.userId, userId),
				or(
					eq(delegationSessions.status, "offer_created"),
					eq(delegationSessions.status, "credential_received"),
				),
			),
		)
		.orderBy(delegationSessions.createdAt)
		.all();

	return sessions[sessions.length - 1];
}
