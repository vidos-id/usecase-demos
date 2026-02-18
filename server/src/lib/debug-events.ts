import type { AuthorizationFlowType } from "shared/api/authorization-sse";
import type {
	DebugEventType,
	DebugLevel,
	DebugSseEvent,
} from "shared/api/debug-sse";
import { appendDebugEventForRequest } from "../stores/pending-auth-requests";
import { appEvents } from "./events";

type DebugScope = {
	requestId: string;
	flowType?: AuthorizationFlowType;
};

type DebugEventInput = {
	eventType: DebugEventType;
	level: DebugLevel;
	message: string;
	flowType?: AuthorizationFlowType;
	timestamp?: string;
	[key: string]: unknown;
};

export const emitDebugEvent = (
	scope: DebugScope,
	event: DebugEventInput,
): DebugSseEvent => {
	const parsed = appendDebugEventForRequest(scope.requestId, {
		...event,
		flowType: event.flowType ?? scope.flowType,
		timestamp: event.timestamp ?? new Date().toISOString(),
	});

	appEvents.emit("debugEvent", {
		requestId: scope.requestId,
		event: parsed,
	});

	return parsed;
};

export const debugEmitters = {
	auth: {
		monitorStarted: (scope: DebugScope) => {
			emitDebugEvent(scope, {
				eventType: "request_lifecycle",
				level: "info",
				message: "Authorization monitor started.",
				stage: "monitor_started",
			});
		},
		monitorStopped: (scope: DebugScope, reason: string) => {
			emitDebugEvent(scope, {
				eventType: "request_lifecycle",
				level: "info",
				message: "Authorization monitor stopped.",
				stage: "monitor_stopped",
				details: { reason },
			});
		},
		streamConnected: (scope: DebugScope) => {
			emitDebugEvent(scope, {
				eventType: "request_lifecycle",
				level: "info",
				message: "Debug stream connected.",
				stage: "stream_connected",
			});
		},
		streamClosed: (scope: DebugScope, reason: string) => {
			emitDebugEvent(scope, {
				eventType: "request_lifecycle",
				level: "info",
				message: "Debug stream closed.",
				stage: "stream_closed",
				details: { reason },
			});
		},
		transitionApplied: (
			scope: DebugScope,
			from: string,
			to: string,
			message: string,
		) => {
			emitDebugEvent(scope, {
				eventType: "state_transition",
				level: "info",
				message,
				from,
				to,
			});
		},
		transitionFailure: (
			scope: DebugScope,
			message: string,
			details?: unknown,
		) => {
			emitDebugEvent(scope, {
				eventType: "system",
				level: "error",
				message,
				code: "transition_failed",
				details: details
					? {
							details,
						}
					: undefined,
			});
		},
	},
	callback: {
		resolvedResponseCode: (
			scope: DebugScope,
			responseCode: string,
			authorizationId: string,
		) => {
			emitDebugEvent(scope, {
				eventType: "system",
				level: "info",
				message: "Callback response code resolved.",
				code: "callback_resolved",
				details: {
					responseCodePrefix: responseCode.slice(0, 8),
					authorizationId,
				},
			});
		},
	},
	vidos: {
		upstreamCallStarted: (scope: DebugScope, operation: string) => {
			emitDebugEvent(scope, {
				eventType: "upstream_call",
				level: "debug",
				message: "Calling Vidos authorizer endpoint.",
				operation,
				status: "started",
			});
		},
		upstreamCallFinished: (
			scope: DebugScope,
			operation: string,
			status: string,
			durationMs?: number,
		) => {
			emitDebugEvent(scope, {
				eventType: "upstream_call",
				level: status === "error" ? "error" : "info",
				message: "Vidos authorizer call completed.",
				operation,
				status,
				durationMs,
			});
		},
	},
};
