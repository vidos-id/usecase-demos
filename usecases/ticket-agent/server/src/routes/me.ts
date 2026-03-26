import { Hono } from "hono";
import { getActiveDelegationSessionByUserId } from "../stores/delegation-sessions";
import { getSessionById } from "../stores/sessions";
import { getUserById } from "../stores/users";

export const meRouter = new Hono().get("/", async (c) => {
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

	const delegationSession = getActiveDelegationSessionByUserId(user.id);

	return c.json({
		id: user.id,
		username: user.username,
		identityVerified: user.identityVerified,
		givenName: user.givenName ?? null,
		familyName: user.familyName ?? null,
		birthDate: user.birthDate ?? null,
		hasActiveAgent: !!delegationSession,
		agentScopes: delegationSession?.scopes ?? null,
	});
});
