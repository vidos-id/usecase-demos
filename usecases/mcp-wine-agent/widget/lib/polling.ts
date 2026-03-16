import { POLL_INTERVAL_MS } from "./constants";
import { isTerminalStatus } from "./state";
import type { VerificationStatus, WidgetToolPayload } from "./types";

type PollingOptions = {
	callCheckoutStatus: (sessionId: string) => Promise<WidgetToolPayload>;
	onResult: (payload: WidgetToolPayload) => void;
	onError: () => void;
	getSessionId: () => string | null;
	getStatus: () => VerificationStatus | undefined;
};

export function createPolling({
	callCheckoutStatus,
	onResult,
	onError,
	getSessionId,
	getStatus,
}: PollingOptions) {
	let pollTimer: number | null = null;
	let pollingSessionId: string | null = null;

	function stopPolling(): void {
		if (pollTimer === null) {
			return;
		}

		window.clearInterval(pollTimer);
		pollTimer = null;
		pollingSessionId = null;
	}

	async function pollStatus(sessionId: string): Promise<void> {
		try {
			const toolResult = await callCheckoutStatus(sessionId);
			onResult(toolResult);
		} catch (_error) {
			onError();
		}
	}

	function startPolling(): void {
		const sessionId = getSessionId();
		if (!sessionId || isTerminalStatus(getStatus())) {
			stopPolling();
			return;
		}

		if (pollTimer !== null && pollingSessionId === sessionId) {
			return;
		}

		stopPolling();
		pollingSessionId = sessionId;
		pollTimer = window.setInterval(() => {
			void pollStatus(sessionId);
		}, POLL_INTERVAL_MS);
		void pollStatus(sessionId);
	}

	return {
		startPolling,
		stopPolling,
	};
}
