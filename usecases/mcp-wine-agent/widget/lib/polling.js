import { POLL_INTERVAL_MS } from "./constants.js";
import { isTerminalStatus } from "./state.js";

export function createPolling({
	callCheckoutStatus,
	onResult,
	onError,
	getSessionId,
	getStatus,
}) {
	let pollTimer = null;
	let pollingSessionId = null;

	function stopPolling() {
		if (!pollTimer) {
			return;
		}

		window.clearInterval(pollTimer);
		pollTimer = null;
		pollingSessionId = null;
	}

	async function pollStatus(sessionId) {
		try {
			const toolResult = await callCheckoutStatus(sessionId);
			onResult(toolResult);
		} catch (_error) {
			onError();
		}
	}

	function startPolling() {
		const sessionId = getSessionId();
		if (!sessionId || isTerminalStatus(getStatus())) {
			stopPolling();
			return;
		}

		if (pollTimer && pollingSessionId === sessionId) {
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
