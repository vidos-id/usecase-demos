import type { Context } from "hono";
import { getSessionById } from "../stores/sessions";

export function getSessionFromRequest(c: Context) {
	const authHeader = c.req.header("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		return getSessionById(authHeader.slice(7));
	}

	const sessionId = c.req.query("session_id");
	if (sessionId) {
		return getSessionById(sessionId);
	}

	return null;
}
