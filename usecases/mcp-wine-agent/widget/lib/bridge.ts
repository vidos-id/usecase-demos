import { normalizeToolOutput } from "./state";
import type {
	JSONRPCMessage,
	JsonRpcToolResultNotification,
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

export function createBridge() {
	async function callCheckoutStatus(
		sessionId: string,
	): Promise<WidgetToolPayload> {
		if (!window.openai?.callTool) {
			throw new Error("callTool is not available in this context.");
		}

		return await window.openai.callTool("get_checkout_status", {
			checkoutSessionId: sessionId,
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
		callCheckoutStatus,
		getInitialToolOutput,
		subscribeToToolOutput,
	};
}
