import type { AuthorizationFlowType } from "shared/api/authorization-sse";
import type { DebugSseEvent, VidosOperation } from "shared/api/debug-sse";
import type { AuthorizationErrorInfo } from "shared/types/vidos-errors";
import { appendDebugEventForRequest } from "../stores/pending-auth-requests";
import { appEvents } from "./events";

export type DebugScope = {
	requestId: string;
	flowType?: AuthorizationFlowType;
};

export const emitDebugEvent = (
	scope: DebugScope,
	event: DebugSseEvent,
): DebugSseEvent => {
	const parsed = appendDebugEventForRequest(scope.requestId, {
		...event,
		requestId: scope.requestId,
		flowType: event.flowType ?? scope.flowType,
		timestamp: event.timestamp ?? new Date().toISOString(),
	});

	appEvents.emit("debugEvent", {
		requestId: scope.requestId,
		event: parsed,
	});

	return parsed;
};

// ---------------------------------------------------------------------------
// Typed emitters — focused on the server ↔ Vidos Authorizer protocol
// ---------------------------------------------------------------------------

export const debugEmitters = {
	/**
	 * Outbound HTTP request to the Vidos Authorizer API.
	 * Call this immediately before making the HTTP call.
	 */
	vidosRequest: (
		scope: DebugScope,
		operation: VidosOperation,
		method: string,
		url: string,
		payload?: Record<string, unknown>,
	) => {
		emitDebugEvent(scope, {
			eventType: "vidos_request",
			level: "info",
			timestamp: new Date().toISOString(),
			message: `→ Vidos: ${operation}`,
			operation,
			method,
			url,
			payload,
		});
	},

	/**
	 * HTTP response received from the Vidos Authorizer API.
	 * Call this immediately after getting the response.
	 */
	vidosResponse: (
		scope: DebugScope,
		operation: VidosOperation,
		httpStatus: number,
		durationMs: number,
		ok: boolean,
		payload?: Record<string, unknown>,
		errorMessage?: string,
	) => {
		emitDebugEvent(scope, {
			eventType: "vidos_response",
			level: ok ? "info" : "error",
			timestamp: new Date().toISOString(),
			message: `← Vidos: ${operation} ${ok ? "succeeded" : "failed"} (${httpStatus}, ${durationMs}ms)`,
			operation,
			httpStatus,
			durationMs,
			ok,
			payload,
			errorMessage,
		});
	},

	/**
	 * Browser DC API credential forwarded from client → server → Vidos.
	 * Call this when the server receives the DC response from the client and
	 * is about to forward it to Vidos.
	 */
	dcApiForwarded: (
		scope: DebugScope,
		authorizationId: string,
		origin: string,
		responseFormat: "jwt" | "vp_token",
	) => {
		emitDebugEvent(scope, {
			eventType: "dc_api_forwarded",
			level: "info",
			timestamp: new Date().toISOString(),
			message: `DC API credential (${responseFormat}) forwarded to Vidos`,
			authorizationId,
			origin,
			responseFormat,
		});
	},

	/**
	 * Vidos reported extracted and verified credential claims after authorization.
	 * Fires separately from policyResult. Source indicates which flow triggered it.
	 */
	credentialResult: (
		scope: DebugScope,
		authorizationId: string,
		source: "direct_post_poll" | "dc_api",
		claims: Record<string, unknown>,
		httpStatus?: number,
		durationMs?: number,
	) => {
		const statusPart =
			httpStatus != null && durationMs != null
				? ` (${httpStatus}, ${durationMs}ms)`
				: "";

		emitDebugEvent(scope, {
			eventType: "credential_result",
			level: "info",
			timestamp: new Date().toISOString(),
			message: `Credential claims received from Vidos (${source})${statusPart}`,
			authorizationId,
			source,
			httpStatus,
			durationMs,
			claims,
		});
	},

	/**
	 * Vidos reported policy evaluation outcome.
	 * Fires separately from credentialResult — always fires when a terminal
	 * authorization status is reached (authorized, rejected, error, expired).
	 */
	policyResult: (
		scope: DebugScope,
		authorizationId: string,
		source: "direct_post_poll" | "dc_api",
		outcome: "authorized" | "rejected" | "error" | "expired",
		policies?: Record<string, unknown>[],
		errorInfo?: AuthorizationErrorInfo,
	) => {
		console.log(
			`[Debug] policyResult: ${outcome} (${source}) for ${authorizationId}`,
		);
		emitDebugEvent(scope, {
			eventType: "policy_result",
			level: outcome === "authorized" ? "info" : "warn",
			timestamp: new Date().toISOString(),
			message: `Policy evaluation: ${outcome} (${source})`,
			authorizationId,
			source,
			outcome,
			policies,
			errorInfo,
		});
	},

	/**
	 * A notable server-side error occurred (identity mismatch, monitor failure, etc.).
	 */
	error: (
		scope: DebugScope,
		message: string,
		code?: string,
		details?: Record<string, unknown>,
	) => {
		emitDebugEvent(scope, {
			eventType: "error",
			level: "error",
			timestamp: new Date().toISOString(),
			message,
			code,
			details,
		});
	},
};
