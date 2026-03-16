import "./styles.css";
import { createBridge } from "./lib/bridge";
import { createDomElements } from "./lib/dom";
import { createPolling } from "./lib/polling";
import { renderApp } from "./lib/render";
import type { AppState, WidgetToolPayload } from "./lib/types";

const dom = createDomElements();
const bridge = createBridge();

const appState: AppState = {
	latestToolOutput: null,
	latestSessionId: null,
	latestQrSvg: "",
	latestAuthorizeUrl: "",
	completionNotified: false,
	paymentCompleted: false,
};

const polling = createPolling({
	callCheckoutStatus: bridge.callCheckoutStatus,
	onResult: render,
	onError: () => {
		dom.statusEl.textContent =
			"Unable to refresh verification status right now. Still waiting for wallet completion...";
	},
	getSessionId: () => appState.latestSessionId,
	getStatus: () => bridge.normalizeToolOutput(appState.latestToolOutput).status,
});

function render(raw: WidgetToolPayload): void {
	appState.latestToolOutput = raw;
	const data = bridge.normalizeToolOutput(raw);
	const qrSvg = data.qrSvg ?? appState.latestQrSvg;
	const authorizeUrl =
		data.authorization?.authorizeUrl ??
		data.authorizeUrl ??
		appState.latestAuthorizeUrl;

	appState.latestSessionId = data.checkoutSessionId ?? appState.latestSessionId;
	appState.latestQrSvg = qrSvg || appState.latestQrSvg;
	appState.latestAuthorizeUrl = authorizeUrl || appState.latestAuthorizeUrl;

	renderApp(dom, {
		data,
		qrSvg,
		authorizeUrl,
		paymentCompleted: appState.paymentCompleted,
	});

	if (
		data.status === "verified" ||
		data.status === "completed" ||
		data.status === "rejected" ||
		data.status === "expired" ||
		data.status === "error"
	) {
		polling.stopPolling();
		if (!appState.completionNotified) {
			appState.completionNotified = true;
			void bridge.notifyAgent(data, appState.latestSessionId);
		}
		return;
	}

	polling.startPolling();
}

bridge.subscribeToToolOutput(render);
render(bridge.getInitialToolOutput());

dom.checkoutButtonEl.addEventListener("click", () => {
	appState.paymentCompleted = true;
	appState.latestToolOutput = {
		structuredContent: {
			...bridge.normalizeToolOutput(appState.latestToolOutput),
			status: "completed",
		},
	};

	render(appState.latestToolOutput);
});
