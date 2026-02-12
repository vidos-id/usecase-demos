import { hc } from "hono/client";
import type { AppType } from "server/client";
import { z } from "zod";
import { getSessionId } from "./auth";

const envSchema = z.object({
	VITE_VIDOS_DEMO_BANK_SERVER_URL: z.string().url(),
});

const env = envSchema.parse({
	VITE_VIDOS_DEMO_BANK_SERVER_URL: import.meta.env
		.VITE_VIDOS_DEMO_BANK_SERVER_URL,
});

// Custom fetch that injects Authorization header when session exists
const authFetch: typeof fetch = (input, init) => {
	const sessionId = getSessionId();
	if (sessionId) {
		const headers = new Headers(init?.headers);
		// Only set if not already present (allow per-request override)
		if (!headers.has("Authorization")) {
			headers.set("Authorization", `Bearer ${sessionId}`);
		}
		return fetch(input, { ...init, headers });
	}
	return fetch(input, init);
};

export const apiClient = hc<AppType>(env.VITE_VIDOS_DEMO_BANK_SERVER_URL, {
	fetch: authFetch,
});
