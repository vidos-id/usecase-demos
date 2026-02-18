import { debugEmitters } from "../lib/debug-events";
import {
	getPendingRequestById,
	type PendingAuthRequest,
	updateRequestToFailed,
} from "../stores/pending-auth-requests";
import { completeAuthorizedPendingRequest } from "./authorization-completion";
import { applyPendingRequestTransition } from "./pending-request-transition";
import { pollAuthorizationStatus } from "./vidos";

const MONITOR_INTERVAL_MS = 1000;

type MonitorState = {
	interval: ReturnType<typeof setInterval>;
	running: boolean;
};

const monitors = new Map<string, MonitorState>();

const isTerminalRequest = (request: PendingAuthRequest): boolean => {
	return request.status !== "pending";
};

async function monitorTick(requestId: string): Promise<void> {
	const state = monitors.get(requestId);
	if (!state || state.running) {
		return;
	}
	state.running = true;

	try {
		const pendingRequest = getPendingRequestById(requestId);
		if (!pendingRequest || isTerminalRequest(pendingRequest)) {
			stopAuthorizationMonitor(requestId);
			return;
		}

		const statusResult = await pollAuthorizationStatus(
			pendingRequest.vidosAuthorizationId,
			{
				requestId: pendingRequest.id,
				flowType: pendingRequest.type,
			},
		);

		await applyPendingRequestTransition({
			pendingRequest,
			status: statusResult.status,
			errorInfo: statusResult.errorInfo,
			onAuthorized: async () => {
				await completeAuthorizedPendingRequest(pendingRequest);
			},
		});

		const latest = getPendingRequestById(requestId);
		if (!latest || isTerminalRequest(latest)) {
			stopAuthorizationMonitor(requestId);
		}
	} catch (error) {
		console.error("[Monitor] Failed to process request:", requestId, error);
		const pendingRequest = getPendingRequestById(requestId);
		if (pendingRequest) {
			debugEmitters.auth.transitionFailure(
				{ requestId, flowType: pendingRequest.type },
				"Authorization monitor tick failed.",
				error,
			);
		}
		updateRequestToFailed(
			requestId,
			error instanceof Error
				? error.message
				: "Authorization monitoring failed.",
		);
		stopAuthorizationMonitor(requestId);
	} finally {
		const latestState = monitors.get(requestId);
		if (latestState) {
			latestState.running = false;
		}
	}
}

export function startAuthorizationMonitor(requestId: string): void {
	if (monitors.has(requestId)) {
		return;
	}

	const pendingRequest = getPendingRequestById(requestId);
	if (pendingRequest) {
		debugEmitters.auth.monitorStarted({
			requestId,
			flowType: pendingRequest.type,
		});
	}

	const interval = setInterval(() => {
		void monitorTick(requestId);
	}, MONITOR_INTERVAL_MS);

	monitors.set(requestId, {
		interval,
		running: false,
	});

	void monitorTick(requestId);
}

export function stopAuthorizationMonitor(requestId: string): void {
	const state = monitors.get(requestId);
	if (!state) {
		return;
	}
	const pendingRequest = getPendingRequestById(requestId);
	clearInterval(state.interval);
	monitors.delete(requestId);
	if (pendingRequest) {
		debugEmitters.auth.monitorStopped(
			{
				requestId,
				flowType: pendingRequest.type,
			},
			"terminal_or_missing",
		);
	}
}

export function getActiveMonitorCount(): number {
	return monitors.size;
}
