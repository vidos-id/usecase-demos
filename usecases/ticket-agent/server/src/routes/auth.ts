import type { Context } from "hono";
import { getSessionById } from "../stores/sessions";
import { getUserById } from "../stores/users";

type Session = NonNullable<ReturnType<typeof getSessionById>>;
type User = NonNullable<ReturnType<typeof getUserById>>;

type AuthSuccess = {
	ok: true;
	session: Session;
	user: User;
};

type AuthFailure = {
	ok: false;
	response: Response;
};

export function requireAuthenticatedUser(
	c: Context,
): AuthSuccess | AuthFailure {
	const sessionId = c.req.header("Authorization")?.replace("Bearer ", "");
	if (!sessionId) {
		return {
			ok: false,
			response: c.json({ error: "Unauthorized" }, 401),
		};
	}

	const session = getSessionById(sessionId);
	if (!session) {
		return {
			ok: false,
			response: c.json({ error: "Invalid or expired session" }, 401),
		};
	}

	const user = getUserById(session.userId);
	if (!user) {
		return {
			ok: false,
			response: c.json({ error: "User not found" }, 404),
		};
	}

	return { ok: true, session, user };
}

export function getAuthenticatedUserIfPresent(c: Context): AuthSuccess | null {
	const sessionId = c.req.header("Authorization")?.replace("Bearer ", "");
	if (!sessionId) {
		return null;
	}

	const session = getSessionById(sessionId);
	if (!session) {
		return null;
	}

	const user = getUserById(session.userId);
	if (!user) {
		return null;
	}

	return { ok: true, session, user };
}
