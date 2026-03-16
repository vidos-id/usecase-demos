export function normalizeToolOutput(raw) {
	if (!raw) {
		return {};
	}

	return raw.structuredContent ?? raw;
}

function isJsonRpcMessage(message) {
	return Boolean(message && message.jsonrpc === "2.0");
}

export function createBridge() {
	let rpcCounter = 0;
	const pendingRequests = new Map();

	window.addEventListener(
		"message",
		(event) => {
			if (event.source !== window.parent) {
				return;
			}

			const message = event.data;
			if (!isJsonRpcMessage(message)) {
				return;
			}

			if (message.id && pendingRequests.has(message.id)) {
				const pending = pendingRequests.get(message.id);
				pendingRequests.delete(message.id);
				if (message.error) {
					pending.reject(message.error);
				} else {
					pending.resolve(message);
				}
			}
		},
		{ passive: true },
	);

	function rpcRequest(method, params) {
		return new Promise((resolve, reject) => {
			const id = `rpc-${++rpcCounter}`;
			pendingRequests.set(id, { resolve, reject });
			window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
			window.setTimeout(() => {
				const pending = pendingRequests.get(id);
				if (!pending) {
					return;
				}

				pendingRequests.delete(id);
				reject(new Error(`${method} timed out`));
			}, 15000);
		});
	}

	function postHostNotification(method, params) {
		window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
	}

	async function callCheckoutStatus(sessionId) {
		if (window.openai?.callTool) {
			return await window.openai.callTool("get_checkout_status", {
				checkoutSessionId: sessionId,
			});
		}

		const response = await rpcRequest("tools/call", {
			name: "get_checkout_status",
			arguments: { checkoutSessionId: sessionId },
		});

		return response?.result ?? response;
	}

	async function notifyAgent(statusData, latestSessionId) {
		const status = statusData?.status;
		const sessionId =
			statusData?.checkoutSessionId ?? latestSessionId ?? "unknown";
		const age = statusData?.verification?.ageCheck;
		const detail =
			status === "verified"
				? age?.requiredAge
					? `Age eligibility confirmed for ${age.requiredAge}+ purchase.`
					: "Age eligibility confirmed."
				: (statusData?.verification?.lastError ??
					"Verification session ended.");

		try {
			await rpcRequest("ui/update-model-context", {
				content: [
					{
						type: "text",
						text: `Checkout verification update for session ${sessionId}: status=${status}. ${detail}`,
					},
				],
			});
		} catch (_error) {}

		postHostNotification("ui/message", {
			role: "user",
			content: [
				{
					type: "text",
					text:
						status === "verified"
							? `Wine age verification completed for checkout session ${sessionId}. Please continue checkout.`
							: `Wine age verification update for checkout session ${sessionId}: ${detail}`,
				},
			],
		});
	}

	function getInitialToolOutput() {
		return window.openai?.toolOutput;
	}

	function subscribeToToolOutput(onRender) {
		window.addEventListener(
			"openai:set_globals",
			(event) => {
				onRender(
					event.detail?.globals?.toolOutput ?? window.openai?.toolOutput,
				);
			},
			{ passive: true },
		);

		window.addEventListener(
			"message",
			(event) => {
				if (event.source !== window.parent) {
					return;
				}

				const message = event.data;
				if (
					!isJsonRpcMessage(message) ||
					message.method !== "ui/notifications/tool-result"
				) {
					return;
				}

				onRender(message.params);
			},
			{ passive: true },
		);
	}

	return {
		normalizeToolOutput,
		rpcRequest,
		callCheckoutStatus,
		notifyAgent,
		getInitialToolOutput,
		subscribeToToolOutput,
	};
}
