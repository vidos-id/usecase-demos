import { normalizeToolOutput } from "./state";
import type {
	HostMessageTextContent,
	JSONRPCMessage,
	JsonRpcToolResultNotification,
	PendingRpcRequest,
	RpcNotificationMessage,
	RpcRequestMessage,
	ToolCallRpcParams,
	VerificationViewData,
	WidgetToolPayload,
} from "./types";

function isJsonRpcMessage(message: unknown): message is JSONRPCMessage {
	return (
		typeof message === "object" &&
		message !== null &&
		"jsonrpc" in message &&
		message.jsonrpc === "2.0"
	);
}

function isJsonRpcResponse(
	message: JSONRPCMessage,
): message is JSONRPCMessage & {
	id: string | number;
	result?: unknown;
	error?: unknown;
} {
	return (
		"id" in message &&
		(typeof message.id === "string" || typeof message.id === "number")
	);
}

function createTextContent(text: string): HostMessageTextContent {
	return { type: "text", text };
}

export function createBridge() {
	let rpcCounter = 0;
	const pendingRequests = new Map<string, PendingRpcRequest>();

	window.addEventListener(
		"message",
		(event: MessageEvent<unknown>) => {
			if (event.source !== window.parent) {
				return;
			}

			const message = event.data;
			if (!isJsonRpcMessage(message) || !isJsonRpcResponse(message)) {
				return;
			}

			const requestId = String(message.id);
			const pending = pendingRequests.get(requestId);
			if (!pending) {
				return;
			}

			pendingRequests.delete(requestId);
			if ("error" in message && message.error) {
				pending.reject(message.error);
				return;
			}

			pending.resolve(message);
		},
		{ passive: true },
	);

	function rpcRequest<TResponse = unknown>(
		method: string,
		params?: unknown,
	): Promise<TResponse> {
		return new Promise((resolve, reject) => {
			const id = `rpc-${++rpcCounter}`;
			const request: RpcRequestMessage = {
				jsonrpc: "2.0",
				id,
				method,
				params,
			};

			pendingRequests.set(id, {
				resolve: (message) => {
					const result =
						typeof message === "object" &&
						message !== null &&
						"result" in message
							? message.result
							: undefined;
					resolve((result ?? message) as TResponse);
				},
				reject,
			});

			window.parent.postMessage(request, "*");
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

	function postHostNotification(method: string, params?: unknown): void {
		const notification: RpcNotificationMessage = {
			jsonrpc: "2.0",
			method,
			params,
		};

		window.parent.postMessage(notification, "*");
	}

	async function callCheckoutStatus(
		sessionId: string,
	): Promise<WidgetToolPayload> {
		if (window.openai?.callTool) {
			return await window.openai.callTool("get_checkout_status", {
				checkoutSessionId: sessionId,
			});
		}

		const params: ToolCallRpcParams = {
			name: "get_checkout_status",
			arguments: { checkoutSessionId: sessionId },
		};

		return await rpcRequest<WidgetToolPayload>("tools/call", params);
	}

	async function notifyAgent(
		statusData: VerificationViewData,
		latestSessionId: string | null,
	): Promise<void> {
		const status = statusData.status;
		const sessionId =
			statusData.checkoutSessionId ?? latestSessionId ?? "unknown";
		const age = statusData.verification?.ageCheck;
		const detail =
			status === "verified"
				? age?.requiredAge
					? `Age eligibility confirmed for ${age.requiredAge}+ purchase.`
					: "Age eligibility confirmed."
				: (statusData.verification?.lastError ?? "Verification session ended.");

		try {
			await rpcRequest("ui/update-model-context", {
				content: [
					createTextContent(
						`Checkout verification update for session ${sessionId}: status=${status}. ${detail}`,
					),
				],
			});
		} catch (_error) {}

		postHostNotification("ui/message", {
			role: "user",
			content: [
				createTextContent(
					status === "verified"
						? `Wine age verification completed for checkout session ${sessionId}. Please continue checkout.`
						: `Wine age verification update for checkout session ${sessionId}: ${detail}`,
				),
			],
		});
	}

	function getInitialToolOutput(): WidgetToolPayload {
		return window.openai?.toolOutput;
	}

	function subscribeToToolOutput(
		onRender: (payload: WidgetToolPayload) => void,
	): void {
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
			(event: MessageEvent<unknown>) => {
				if (event.source !== window.parent) {
					return;
				}

				const message = event.data;
				if (!isJsonRpcMessage(message)) {
					return;
				}

				const notification = message as JsonRpcToolResultNotification;
				if (notification.method !== "ui/notifications/tool-result") {
					return;
				}

				onRender(notification.params);
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
