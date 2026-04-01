import { hc } from "hono/client";
import type { AppType } from "ticket-agent-server/client";
import {
	buildApiUrl as buildSharedApiUrl,
	createAuthFetch,
} from "vidos-web/api-client";
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
	return buildSharedApiUrl(apiBaseUrl, pathname, query);
}

const authFetch = createAuthFetch({ getToken: getSessionId });

export const apiClient = hc<AppType>(apiBaseUrl, {
	fetch: authFetch,
});
