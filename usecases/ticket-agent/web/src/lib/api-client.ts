import { hc } from "hono/client";
import type { AppType } from "ticket-agent-server/client";
import { z } from "zod";
import { getSessionId } from "./auth";

const envSchema = z.object({
	VITE_TICKET_AGENT_SERVER_URL: z.string().url(),
});

const env = envSchema.parse({
	VITE_TICKET_AGENT_SERVER_URL: import.meta.env.VITE_TICKET_AGENT_SERVER_URL,
});

export const apiBaseUrl = env.VITE_TICKET_AGENT_SERVER_URL;

export function buildApiUrl(
	pathname: string,
	query?: Record<string, string | undefined>,
): string {
	const url = new URL(pathname, apiBaseUrl);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value) {
				url.searchParams.set(key, value);
			}
		}
	}
	return url.toString();
}

const authFetch: typeof fetch = ((input, init) => {
	const sessionId = getSessionId();
	if (sessionId) {
		const headers = new Headers(init?.headers);
		if (!headers.has("Authorization")) {
			headers.set("Authorization", `Bearer ${sessionId}`);
		}
		return fetch(input, { ...init, headers });
	}
	return fetch(input, init);
}) as typeof fetch;

export const apiClient = hc<AppType>(apiBaseUrl, {
	fetch: authFetch,
});
