import { completeAuthorizedPendingRequest } from "./authorization-completion";
import { applyPendingRequestTransition } from "./pending-request-transition";
import { pollAuthorizationStatus } from "./vidos";
import {
	getPendingRequestById,
	type PendingAuthRequest,
	updateRequestToFailed,
} from "../stores/pending-auth-requests";

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
	clearInterval(state.interval);
	monitors.delete(requestId);
}

export function getActiveMonitorCount(): number {
	return monitors.size;
}
