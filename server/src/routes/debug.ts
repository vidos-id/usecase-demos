import { Hono } from "hono";
import { debugSseEventNames, debugSseEventSchema } from "shared/api/debug-sse";
import { appEvents } from "../lib/events";
import {
	getDebugSessionIdFromRequest,
	getSessionFromRequest,
} from "../lib/request-session";
import { createSseResponse, createTypedSseSender } from "../lib/sse";
import {
	getDebugEventsForRequest,
	getPendingRequestDebugScope,
} from "../stores/pending-auth-requests";

const STREAM_CLOSE_STATUSES = new Set([
	"authorized",
	"rejected",
	"expired",
	"error",
	"not_found",
	"account_exists",
]);

export const debugRouter = new Hono().get("/stream/:requestId", (c) => {
	const requestId = c.req.param("requestId");
	const scope = getPendingRequestDebugScope(requestId);
	if (!scope) {
		return c.json({ error: "Request not found" }, 404);
	}

	const session = getSessionFromRequest(c);
	const debugSessionId = getDebugSessionIdFromRequest(c);

	const authorizeScope = (currentScope: typeof scope) => {
		if (currentScope.ownerUserId) {
			if (!session) {
				return { ok: false, status: 401 as const, error: "Unauthorized" };
			}
			if (session.userId !== currentScope.ownerUserId) {
				return { ok: false, status: 403 as const, error: "Forbidden" };
			}
		}

		if (currentScope.ownerSessionId) {
			if (session) {
				if (session.id !== currentScope.ownerSessionId) {
					return { ok: false, status: 403 as const, error: "Forbidden" };
				}
			} else if (debugSessionId !== currentScope.ownerSessionId) {
				return { ok: false, status: 401 as const, error: "Unauthorized" };
			}
		}

		return { ok: true } as const;
	};

	const scopeAuth = authorizeScope(scope);
	if (!scopeAuth.ok) {
		return c.json({ error: scopeAuth.error }, scopeAuth.status);
	}

	return createSseResponse(c, (connection) => {
		const sender = createTypedSseSender(connection.sendRaw, (value) =>
			debugSseEventSchema.parse(value),
		);
		const queuedLiveEvents: ReturnType<typeof debugSseEventSchema.parse>[] = [];
		const replaySentEvents = new Set<
			ReturnType<typeof debugSseEventSchema.parse>
		>();
		let isReplaying = true;

		const debugEventListener = (payload: {
			requestId: string;
			event: ReturnType<typeof debugSseEventSchema.parse>;
		}) => {
			if (payload.requestId !== requestId) {
				return;
			}

			const latestScope = getPendingRequestDebugScope(requestId);
			if (!latestScope) {
				connection.close();
				return;
			}

			const liveScopeAuth = authorizeScope(latestScope);
			if (!liveScopeAuth.ok) {
				connection.close();
				return;
			}

			if (isReplaying) {
				queuedLiveEvents.push(payload.event);
				return;
			}

			sender.send(payload.event);
		};

		const authEventListener = (payload: {
			requestId: string;
			event: { eventType: string };
		}) => {
			if (payload.requestId !== requestId) {
				return;
			}
			if (STREAM_CLOSE_STATUSES.has(payload.event.eventType)) {
				connection.close();
			}
		};

		appEvents.on("debugEvent", debugEventListener);
		appEvents.on("authorizationRequestEvent", authEventListener);

		for (const event of getDebugEventsForRequest(requestId)) {
			if (!debugSseEventNames.includes(event.eventType)) {
				continue;
			}
			replaySentEvents.add(event);
			sender.send(event);
		}

		isReplaying = false;
		for (const event of queuedLiveEvents) {
			if (replaySentEvents.has(event)) {
				continue;
			}
			sender.send(event);
		}

		if (
			scope.terminalStatus &&
			STREAM_CLOSE_STATUSES.has(scope.terminalStatus)
		) {
			connection.close();
		}

		connection.onClose(() => {
			appEvents.off("debugEvent", debugEventListener);
			appEvents.off("authorizationRequestEvent", authEventListener);
		});
	});
});
