import type { Context } from "hono";
import { getSessionById } from "../stores/sessions";

const DEBUG_SESSION_COOKIE_NAME = "debug_session_id";

const parseCookies = (c: Context): Record<string, string> => {
	const cookieHeader = c.req.header("Cookie");
	if (!cookieHeader) {
		return {};
	}

	const cookies: Record<string, string> = {};
	for (const part of cookieHeader.split(";")) {
		const [rawName, ...rawValueParts] = part.trim().split("=");
		if (!rawName || rawValueParts.length === 0) {
			continue;
		}
		cookies[rawName] = decodeURIComponent(rawValueParts.join("="));
	}

	return cookies;
};

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

export const getDebugSessionIdFromRequest = (
	c: Context,
): string | undefined => {
	const sessionIdFromQuery = c.req.query("debug_session_id");
	if (sessionIdFromQuery) {
		return sessionIdFromQuery;
	}

	const cookies = parseCookies(c);
	const cookieSessionId = cookies[DEBUG_SESSION_COOKIE_NAME];
	return cookieSessionId || undefined;
};

export const createDebugSessionCookie = (sessionId: string): string => {
	return `${DEBUG_SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`;
};
