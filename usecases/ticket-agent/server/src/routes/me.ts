import { serializeCredentialOfferUri } from "@vidos-id/issuer";
import { Hono } from "hono";
import type {
	DelegatedCredentialSummary,
	DelegationScope,
} from "ticket-agent-shared/types/delegation";
import { oid4vciOfferSchema } from "ticket-agent-shared/types/delegation";
import { getDelegationSessionsByUserId } from "../stores/delegation-sessions";
import { requireAuthenticatedUser } from "./auth";

function mapDelegationState(session: {
	status: string;
	preAuthorizedCodeExpiresAt: string | null;
	preAuthorizedCodeUsedAt: string | null;
	accessToken: string | null;
	lastNonce: string | null;
	credentialSuspendedAt: string | null;
	credentialRevokedAt: string | null;
}): DelegatedCredentialSummary["state"] {
	if (session.status === "revoked") {
		return "credential_revoked";
	}

	if (session.status === "suspended") {
		return "credential_suspended";
	}

	if (session.status === "credential_received") {
		return "credential_active";
	}

	if (
		session.preAuthorizedCodeUsedAt ||
		session.accessToken ||
		session.lastNonce
	) {
		return "offer_redeeming";
	}

	if (
		!session.preAuthorizedCodeExpiresAt ||
		new Date(session.preAuthorizedCodeExpiresAt).getTime() <= Date.now()
	) {
		return "offer_expired";
	}

	return "offer_ready";
}

function mapDelegationStatusValue(value: number | null | undefined) {
	if (value === 2) {
		return "revoked" as const;
	}

	if (value === 1) {
		return "suspended" as const;
	}

	return "active" as const;
}

function getIssuedCredentialStatus(session: {
	credentialStatus: unknown;
	credentialStatusValue: number | null | undefined;
}) {
	if (!session.credentialStatus) {
		return null;
	}

	return mapDelegationStatusValue(session.credentialStatusValue);
}

export const meRouter = new Hono().get("/", async (c) => {
	const auth = requireAuthenticatedUser(c);
	if (!auth.ok) {
		return auth.response;
	}

	const { user } = auth;
	const delegationSessions = getDelegationSessionsByUserId(user.id);
	const delegatedCredentials: DelegatedCredentialSummary[] = delegationSessions
		.slice()
		.reverse()
		.map((delegationSession) => {
			const state = mapDelegationState(delegationSession);
			const parsedOffer = oid4vciOfferSchema.safeParse(delegationSession.offer);
			const credentialOfferDeepLink =
				state === "offer_ready" || state === "offer_redeeming"
					? parsedOffer.success
						? serializeCredentialOfferUri(parsedOffer.data)
						: null
					: null;

			return {
				delegationId: delegationSession.id,
				state,
				status: getIssuedCredentialStatus(delegationSession),
				scopes: (delegationSession.scopes as DelegationScope[] | null) ?? [],
				validUntil: delegationSession.validUntil,
				offerExpiresAt: delegationSession.preAuthorizedCodeExpiresAt,
				offerRedeemedAt: delegationSession.preAuthorizedCodeUsedAt,
				credentialIssuedAt: delegationSession.credentialIssuedAt,
				credentialSuspendedAt: delegationSession.credentialSuspendedAt,
				credentialRevokedAt: delegationSession.credentialRevokedAt,
				credentialOfferUri:
					state === "offer_ready" || state === "offer_redeeming"
						? delegationSession.offerUri
						: null,
				credentialOfferDeepLink,
				credentialStatus:
					(delegationSession.credentialStatus as {
						status_list: {
							idx: number;
							uri: string;
						};
					} | null) ?? null,
				holderPublicKey:
					(delegationSession.holderPublicKey as Record<
						string,
						unknown
					> | null) ?? null,
			};
		});

	return c.json({
		id: user.id,
		username: user.username,
		identityVerified: user.identityVerified,
		givenName: user.givenName ?? null,
		familyName: user.familyName ?? null,
		birthDate: user.birthDate ?? null,
		hasActiveAgent: delegatedCredentials.some(
			(credential) => credential.status === "active",
		),
		agentScopes: delegatedCredentials.flatMap((credential) =>
			credential.status === "active" ? credential.scopes : [],
		),
		delegation:
			delegatedCredentials.find(
				(credential) => credential.status === "active",
			) ??
			delegatedCredentials.find(
				(credential) => credential.state === "offer_ready",
			) ??
			delegatedCredentials[0] ??
			null,
		delegatedCredentials,
	});
});
