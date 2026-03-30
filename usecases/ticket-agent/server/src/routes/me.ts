import { Hono } from "hono";
import { getActiveDelegationSessionByUserId } from "../stores/delegation-sessions";
import { requireAuthenticatedUser } from "./auth";

export const meRouter = new Hono().get("/", async (c) => {
	const auth = requireAuthenticatedUser(c);
	if (!auth.ok) {
		return auth.response;
	}

	const { user } = auth;
	const delegationSession = getActiveDelegationSessionByUserId(user.id);

	return c.json({
		id: user.id,
		username: user.username,
		identityVerified: user.identityVerified,
		givenName: user.givenName ?? null,
		familyName: user.familyName ?? null,
		birthDate: user.birthDate ?? null,
		hasActiveAgent: delegationSession?.status === "credential_received",
		agentScopes: delegationSession?.scopes ?? null,
	});
});
