import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	delegationCredentialActionRequestSchema,
	delegationIssueRequestSchema,
	delegationReactivateResponseSchema,
	delegationRevokeResponseSchema,
	delegationSuspendResponseSchema,
} from "ticket-agent-shared/api/delegation";
import { env } from "../env";
import {
	getDelegationCredentialStatusValue,
	issueDelegationCredential,
	reactivateDelegationCredentialStatus,
	revokeDelegationCredentialStatus,
	suspendDelegationCredentialStatus,
} from "../services/issuer";
import {
	createDelegationSession,
	getDelegationSessionById,
	reactivateDelegationSession,
	revokeDelegationSession,
	suspendDelegationSession,
} from "../stores/delegation-sessions";
import { requireAuthenticatedUser } from "./auth";

export const delegationRouter = new Hono()
	.post(
		"/issue",
		zValidator("json", delegationIssueRequestSchema),
		async (c) => {
			const auth = requireAuthenticatedUser(c);
			if (!auth.ok) {
				return auth.response;
			}
			const { session, user } = auth;

			if (
				!user.identityVerified ||
				!user.givenName ||
				!user.familyName ||
				!user.birthDate
			) {
				return c.json(
					{
						error:
							"Identity must be verified before creating a delegation offer",
					},
					400,
				);
			}

			const { agentName, scopes } = c.req.valid("json");
			const validUntil = new Date(
				Date.now() + 30 * 24 * 60 * 60 * 1000,
			).toISOString();
			const delegationSessionId = crypto.randomUUID();
			const publicBaseUrl = env.ISSUER_PUBLIC_URL ?? new URL(c.req.url).origin;
			const credentialOfferUri = new URL(
				`/api/delegation/offers/${delegationSessionId}`,
				publicBaseUrl,
			).toString();

			const offer = await issueDelegationCredential({
				delegationId: delegationSessionId,
				agentName,
				givenName: user.givenName,
				familyName: user.familyName,
				birthDate: user.birthDate,
				scopes,
				validUntil,
			});

			createDelegationSession({
				id: delegationSessionId,
				userId: session.userId,
				agentName,
				scopes,
				verifiedClaims: {
					delegation_id: delegationSessionId,
					agent_name: agentName,
					given_name: user.givenName,
					family_name: user.familyName,
					birth_date: user.birthDate,
					delegation_scopes: scopes,
					valid_until: validUntil,
				},
				validUntil,
				offer: offer.offer,
				offerUri: credentialOfferUri,
				preAuthorizedCode: offer.preAuthorizedGrant.preAuthorizedCode,
				preAuthorizedCodeExpiresAt: new Date(
					offer.preAuthorizedGrant.expiresAt * 1000,
				).toISOString(),
			});

			const offerExpiresAt = new Date(
				offer.preAuthorizedGrant.expiresAt * 1000,
			).toISOString();

			return c.json({
				delegationId: delegationSessionId,
				agentName,
				credentialOffer: offer.offer,
				credentialOfferUri,
				credentialOfferDeepLink: offer.offerUri,
				scopes,
				offerExpiresAt,
				validUntil,
			});
		},
	)
	.post(
		"/suspend",
		zValidator("json", delegationCredentialActionRequestSchema),
		async (c) => {
			const auth = requireAuthenticatedUser(c);
			if (!auth.ok) {
				return auth.response;
			}

			const { delegationId } = c.req.valid("json");
			const delegationSession = getDelegationSessionById(delegationId);
			if (
				!delegationSession ||
				delegationSession.userId !== auth.session.userId
			) {
				return c.json({ error: "Delegation credential not found" }, 404);
			}
			if (!delegationSession.credentialStatus) {
				return c.json({ error: "Credential has not been issued yet" }, 400);
			}
			const currentStatus = getDelegationCredentialStatusValue(
				delegationSession.credentialStatus,
			);
			if (currentStatus === 2) {
				return c.json(
					{ error: "Revoked credentials cannot be suspended" },
					400,
				);
			}
			if (currentStatus === 1) {
				return c.json(
					delegationSuspendResponseSchema.parse({
						delegationId,
						status: "suspended",
						suspendedAt:
							delegationSession.credentialSuspendedAt ??
							new Date().toISOString(),
					}),
				);
			}

			suspendDelegationCredentialStatus(delegationSession.credentialStatus);
			const suspendedAt = new Date().toISOString();
			suspendDelegationSession(delegationId, suspendedAt);

			return c.json(
				delegationSuspendResponseSchema.parse({
					delegationId,
					status: "suspended",
					suspendedAt,
				}),
			);
		},
	)
	.post(
		"/reactivate",
		zValidator("json", delegationCredentialActionRequestSchema),
		async (c) => {
			const auth = requireAuthenticatedUser(c);
			if (!auth.ok) {
				return auth.response;
			}

			const { delegationId } = c.req.valid("json");
			const delegationSession = getDelegationSessionById(delegationId);
			if (
				!delegationSession ||
				delegationSession.userId !== auth.session.userId
			) {
				return c.json({ error: "Delegation credential not found" }, 404);
			}
			if (!delegationSession.credentialStatus) {
				return c.json({ error: "Credential has not been issued yet" }, 400);
			}
			const currentStatus = getDelegationCredentialStatusValue(
				delegationSession.credentialStatus,
			);
			if (currentStatus === 2) {
				return c.json(
					{ error: "Revoked credentials cannot be reactivated" },
					400,
				);
			}
			if (currentStatus !== 1) {
				return c.json(
					delegationReactivateResponseSchema.parse({
						delegationId,
						status: "active",
						reactivatedAt: new Date().toISOString(),
					}),
				);
			}

			reactivateDelegationCredentialStatus(delegationSession.credentialStatus);
			const reactivatedAt = new Date().toISOString();
			reactivateDelegationSession(delegationId, reactivatedAt);

			return c.json(
				delegationReactivateResponseSchema.parse({
					delegationId,
					status: "active",
					reactivatedAt,
				}),
			);
		},
	)
	.post(
		"/revoke",
		zValidator("json", delegationCredentialActionRequestSchema),
		async (c) => {
			const auth = requireAuthenticatedUser(c);
			if (!auth.ok) {
				return auth.response;
			}

			const { delegationId } = c.req.valid("json");
			const delegationSession = getDelegationSessionById(delegationId);

			if (
				!delegationSession ||
				delegationSession.userId !== auth.session.userId
			) {
				return c.json({ error: "Delegation credential not found" }, 404);
			}

			if (!delegationSession.credentialStatus) {
				return c.json({ error: "Credential has not been issued yet" }, 400);
			}

			const currentStatus = getDelegationCredentialStatusValue(
				delegationSession.credentialStatus,
			);
			if (currentStatus === 2) {
				return c.json(
					delegationRevokeResponseSchema.parse({
						delegationId,
						revokedAt:
							delegationSession.credentialRevokedAt ?? new Date().toISOString(),
					}),
				);
			}

			try {
				revokeDelegationCredentialStatus(delegationSession.credentialStatus);
			} catch (error) {
				console.error("[Delegation] Failed to revoke credential:", error);
				return c.json(
					{
						error:
							error instanceof Error
								? error.message
								: "Failed to revoke credential",
					},
					500,
				);
			}
			const revokedAt = new Date().toISOString();
			revokeDelegationSession(delegationId, revokedAt);

			return c.json(
				delegationRevokeResponseSchema.parse({
					delegationId,
					revokedAt,
				}),
			);
		},
	)
	.get("/offers/:delegationId", (c) => {
		const delegationSession = getDelegationSessionById(
			c.req.param("delegationId"),
		);
		if (!delegationSession?.offer) {
			return c.json({ error: "Delegation offer not found" }, 404);
		}

		return c.json(delegationSession.offer);
	});
