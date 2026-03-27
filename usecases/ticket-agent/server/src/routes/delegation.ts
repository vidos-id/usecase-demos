import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { delegationIssueRequestSchema } from "ticket-agent-shared/api/delegation";
import { issueDelegationCredential } from "../services/issuer";
import {
	createDelegationSession,
	revokePreviousDelegationSessions,
	updateDelegationSessionCredentialIssued,
} from "../stores/delegation-sessions";
import { getSessionById } from "../stores/sessions";
import { getUserById } from "../stores/users";

export const delegationRouter = new Hono().post(
	"/issue",
	zValidator("json", delegationIssueRequestSchema),
	async (c) => {
		const sessionId = c.req.header("Authorization")?.replace("Bearer ", "");
		if (!sessionId) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const session = getSessionById(sessionId);
		if (!session) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		const user = getUserById(session.userId);
		if (!user) {
			return c.json({ error: "User not found" }, 404);
		}

		if (
			!user.identityVerified ||
			!user.givenName ||
			!user.familyName ||
			!user.birthDate
		) {
			return c.json(
				{
					error:
						"Identity must be verified before issuing delegation credential",
				},
				400,
			);
		}

		const { agentPublicKey, scopes } = c.req.valid("json");
		const validUntil = new Date(
			Date.now() + 30 * 24 * 60 * 60 * 1000,
		).toISOString();
		const delegationSessionId = crypto.randomUUID();

		const credential = await issueDelegationCredential({
			delegationId: delegationSessionId,
			givenName: user.givenName,
			familyName: user.familyName,
			birthDate: user.birthDate,
			agentPublicJwk: agentPublicKey,
			scopes,
			validUntil,
		});

		revokePreviousDelegationSessions(session.userId, delegationSessionId);

		createDelegationSession({
			id: delegationSessionId,
			userId: session.userId,
			authorizationId: "direct-issuance",
		});

		updateDelegationSessionCredentialIssued(delegationSessionId, {
			agentPublicKey,
			scopes,
			issuedCredential: credential,
		});

		return c.json({
			credential,
			delegatorName: `${user.givenName} ${user.familyName}`,
			scopes,
			validUntil,
		});
	},
);
