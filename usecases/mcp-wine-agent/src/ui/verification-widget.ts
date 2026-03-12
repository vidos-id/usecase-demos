import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import QRCode from "qrcode";

const WINE_PRIMARY = "#722F37";
const WINE_BG = "#FDF8F3";
const WINE_TEXT = "#2D1810";
const VINOS_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="185" height="220" viewBox="0 0 185 220" fill="none"><path d="M 125.94,17.9 C 125.38,16.66 125.12,17.37 125.38,18.73 C 127.17,27.71 128.72,39.93 127.72,48.86 C 125.68,68.09 111.07,85.11 92.11,85.11 C 73.14,85.11 60.12,68.01 57.21,52.53 C 55.32,42.77 57.62,30.71 59.59,20.06 C 59.81,18.86 59.29,17.59 58.73,18.9 C 54.11,29.78 52.19,40.02 52.5,51.95 C 52.92,67.71 59.77,77.86 73.93,87.89 C 86.31,96.61 89.45,99.68 89.45,114.9 V 150.41 C 81.37,151.21 75.41,152.28 71.72,153.69 C 68.98,154.71 67.71,155.73 67.71,156.98 C 67.71,160.78 78.76,162.45 92.11,162.45 C 103.47,162.45 117.28,160.34 117.28,156.93 C 117.28,154.32 112.36,153.21 109.22,152.5 C 105.91,151.71 100.35,150.86 94.48,150.32 V 114.81 C 94.48,100.16 98.22,96.01 107.89,89.16 C 120.73,79.86 131.78,72.61 132.34,52.91 C 132.69,42.72 130.08,27.84 125.94,17.9 Z M 107.91,156.51 C 107.91,158.44 100.88,159.15 92.11,159.15 C 83.34,159.15 77.12,158.08 77.12,156.41 C 77.12,154.48 81.21,153.32 91.28,153.32 C 100.05,153.32 107.91,154.57 107.91,156.51 Z" fill="#641A2D"/><path d="M 131.18,6 H 109.01 V 7.89 C 114.83,7.89 117.89,9.29 116.77,15.02 C 116.29,17.59 113.09,24.92 111.38,28.97 L 95.32,66.16 L 76.06,20.11 C 74.81,16.81 73.78,13.98 73.78,12.18 C 73.78,9.12 75.93,7.96 80.06,7.87 V 6 H 53.42 V 7.89 C 58.71,7.89 60.81,9.73 63.14,15.2 L 89.91,78.81 C 90.48,80.31 92.98,80.31 93.41,78.9 L 118.82,19.93 C 122.91,10.41 126.66,7.89 131.18,7.89 V 6 Z" fill="#641A2D"/><path d="M 25.62,213.79 L 12.63,183.82 C 11.47,180.95 10.67,179.83 7.76,179.83 V 178.76 H 21.16 V 179.83 C 17.51,179.83 17.03,180.95 18.15,183.78 L 27.32,207.01 L 36.62,184.04 C 37.78,181.31 37.03,179.83 33.38,179.83 V 178.76 H 43.66 V 179.83 C 41.15,179.83 39.61,181.08 38.21,184.6 L 26.23,213.79 H 25.62 Z" fill="#641A2D"/><path d="M 47.62,213 V 211.93 C 51.08,211.93 51.65,210.81 51.65,206.11 V 185.8 C 51.65,181.1 51.08,179.98 47.62,179.98 V 178.91 H 60.18 V 179.98 C 56.72,179.98 56.16,181.1 56.16,185.8 V 206.11 C 56.16,210.81 56.72,211.93 60.18,211.93 V 213 H 47.62 Z" fill="#641A2D"/><path d="M 96.53,213.79 L 72.71,184.39 V 206.11 C 72.71,210.81 73.27,211.93 76.92,211.93 V 213 H 66.64 V 211.93 C 70.06,211.93 70.67,210.81 70.67,206.11 V 185.8 C 70.67,181.1 70.06,179.98 66.64,179.98 V 178.91 H 73.62 L 95.78,205.94 V 186.32 C 95.78,181.62 95.21,179.98 91.56,179.98 V 178.91 H 102.35 V 179.98 C 98.93,179.98 98.32,181.1 98.32,185.8 V 213.79 H 96.53 Z" fill="#641A2D"/><path d="M 127.55,213.92 C 116.41,213.92 108.91,205.72 108.91,196.66 C 108.91,187.51 116.72,178.74 127.73,178.74 C 137.72,178.74 144.92,187.07 144.92,196.31 C 144.92,205.32 137.5,213.92 127.55,213.92 Z M 127.12,179.98 C 117.91,179.98 114.31,188.58 114.31,195.34 C 114.31,203.98 119.71,212.23 127.86,212.23 C 136.11,212.23 139.91,204.28 139.91,197.12 C 139.91,188.88 134.41,179.98 127.12,179.98 Z" fill="#641A2D"/><path d="M 153.78,211.66 V 202.42 H 154.94 C 155.69,208.77 159.48,212.06 164.68,212.06 C 169.11,212.06 172.41,209.68 172.41,205.41 C 172.41,202.11 170.32,200.06 165.53,198.02 L 162.71,196.86 C 158.15,194.93 154.94,192.68 154.94,187.42 C 154.94,182.17 159.26,178.74 165.31,178.74 C 168.61,178.74 171.12,179.66 173.45,179.98 L 174.71,179.41 V 188.18 H 173.54 C 172.88,183.52 170.01,180.46 165.41,180.46 C 161.41,180.46 158.91,182.97 158.91,186.53 C 158.91,189.78 161.15,191.62 165.19,193.31 L 168.06,194.51 C 173.93,197.02 177.03,199.26 177.03,204.56 C 177.03,210.43 172.28,213.77 165.71,213.77 C 161.82,213.79 158.41,212.63 155.16,211.66 H 153.78 Z" fill="#641A2D"/></svg>`;
export const VERIFICATION_WIDGET_URI = "ui://widget/verification.html";
export const VERIFICATION_WIDGET_MIME_TYPE = "text/html;profile=mcp-app";

function getWidgetDomain(): string {
	return process.env.WIDGET_DOMAIN ?? "https://mcp-wine-agent.example.com";
}

function getWidgetCsp() {
	return {
		connectDomains: [],
		resourceDomains: ["https://persistent.oaistatic.com"],
	};
}

export async function generateQrSvg(url: string): Promise<string> {
	try {
		const svg = await QRCode.toString(url, {
			type: "svg",
			margin: 2,
			width: 200,
			color: {
				dark: WINE_PRIMARY,
				light: "#FFFFFF",
			},
		});
		return svg;
	} catch {
		return "";
	}
}

function generateAppWidgetHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Age Verification</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${WINE_BG};
      color: ${WINE_TEXT};
      padding: 20px;
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    .app {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${WINE_PRIMARY}20;
    }
    .brand-mark {
      width: 88px;
      margin: 0 auto 10px;
      padding: 8px
      color: ${WINE_PRIMARY};
    }
    .brand-mark svg {
      display: block;
      width: 100%;
      height: auto;
    }
    .header h1 {
      font-size: 1.25rem;
      font-weight: 600;
      color: ${WINE_PRIMARY};
      margin-bottom: 4px;
    }
    .header p {
      font-size: 0.875rem;
      color: ${WINE_TEXT}99;
    }
    .qr-container {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      text-align: center;
      margin-bottom: 20px;
      border: 1px solid ${WINE_PRIMARY}15;
      width: 100%;
    }
    .qr-code {
      width: min(100%, 320px);
      min-height: min(320px, calc(100vw - 96px));
      aspect-ratio: 1 / 1;
      margin: 0 auto;
      background: white;
      padding: 12px;
      border-radius: 12px;
      border: 2px solid ${WINE_PRIMARY}20;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .qr-code svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .instructions {
      background: ${WINE_PRIMARY}08;
      border-radius: 12px;
      padding: 16px;
      font-size: 0.875rem;
      line-height: 1.5;
      color: ${WINE_TEXT}cc;
      word-break: break-word;
    }
    .instructions strong {
      color: ${WINE_PRIMARY};
      display: block;
      margin-bottom: 8px;
    }
    .wallet-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 999px;
      background: ${WINE_PRIMARY};
      color: white;
      font-weight: 600;
      text-decoration: none;
      width: 100%;
      max-width: 100%;
    }
    .wallet-link:hover,
    .wallet-link:focus-visible {
      opacity: 0.92;
    }
    .payment-panel {
      margin-top: 18px;
      padding: 16px;
      border-radius: 16px;
      background: linear-gradient(180deg, #fffaf6 0%, #fff 100%);
      border: 1px solid ${WINE_PRIMARY}18;
      box-shadow: 0 4px 18px rgba(0,0,0,0.06);
    }
    .payment-panel h2 {
      font-size: 1rem;
      color: ${WINE_PRIMARY};
      margin-bottom: 6px;
    }
    .payment-panel p {
      font-size: 0.875rem;
      line-height: 1.5;
      color: ${WINE_TEXT}bb;
      margin-bottom: 12px;
    }
    .payment-grid {
      display: grid;
      gap: 10px;
      grid-template-columns: 1fr;
    }
    .payment-row {
      display: grid;
      gap: 10px;
      grid-template-columns: 1fr 1fr;
      margin-top: 10px;
    }
    .payment-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .payment-field label {
      font-size: 0.75rem;
      font-weight: 600;
      color: ${WINE_TEXT}99;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .payment-field input {
      width: 100%;
      border: 1px solid ${WINE_PRIMARY}20;
      background: #fff;
      border-radius: 12px;
      padding: 12px 13px;
      color: ${WINE_TEXT};
      font-size: 0.95rem;
    }
    .payment-field input:disabled {
      color: ${WINE_TEXT};
      -webkit-text-fill-color: ${WINE_TEXT};
      opacity: 1;
    }
    .checkout-button {
      margin-top: 14px;
      width: 100%;
      border: 0;
      border-radius: 999px;
      background: ${WINE_PRIMARY};
      color: #fff;
      font-weight: 700;
      padding: 12px 16px;
      cursor: pointer;
    }
    .checkout-button:disabled {
      cursor: default;
      opacity: 0.7;
    }
    .payment-success {
      margin-top: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      background: #eaf7ef;
      color: #1f6a3a;
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .payment-success strong {
      display: block;
      margin-bottom: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 0.75rem;
      color: ${WINE_TEXT}66;
    }
    .status {
      margin-top: 14px;
      padding: 12px 14px;
      border-radius: 12px;
      background: ${WINE_PRIMARY}08;
      color: ${WINE_TEXT}cc;
      font-size: 0.875rem;
      line-height: 1.5;
      text-align: left;
      word-break: break-word;
    }
    .placeholder {
      font-size: 0.875rem;
      color: ${WINE_TEXT}99;
      text-align: center;
    }
    .hidden { display: none; }
    @media (max-width: 480px) {
      body {
        padding: 16px;
      }
      .qr-container {
        padding: 16px;
      }
      .qr-code {
        width: 100%;
        min-height: 0;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="header">
      <div class="brand-mark">${VINOS_LOGO_SVG}</div>
      <h1>Checkout Verification</h1>
      <p>Verify your identity to complete your Vinos order</p>
    </div>

    <div class="qr-container">
      <div id="qr-code" class="qr-code">
        <div class="placeholder">Waiting for verification data...</div>
      </div>
      <div id="status" class="status">Waiting for checkout session details...</div>
    </div>

    <div class="instructions">
      <strong>Verify with your wallet</strong>
      <div id="instructions-text">Scan this QR code with your EUDI Wallet app.</div>
      <div id="authorization-link" class="hidden"></div>
    </div>

    <div id="payment-panel" class="payment-panel hidden">
      <h2>Complete your Vinos payment</h2>
      <p>Verification is complete. Continue with payment below if the chat does not proceed automatically.</p>
      <div class="payment-grid">
        <div class="payment-field">
          <label for="card-name">Cardholder</label>
          <input id="card-name" type="text" value="Ava Shopper" disabled>
        </div>
        <div class="payment-field">
          <label for="card-number">Card number</label>
          <input id="card-number" type="text" value="4242 4242 4242 4242" disabled>
        </div>
      </div>
      <div class="payment-row">
        <div class="payment-field">
          <label for="card-expiry">Expiry</label>
          <input id="card-expiry" type="text" value="12/28" disabled>
        </div>
        <div class="payment-field">
          <label for="card-cvc">CVC</label>
          <input id="card-cvc" type="text" value="123" disabled>
        </div>
      </div>
      <button id="checkout-button" class="checkout-button" type="button">Pay now</button>
    </div>

    <div id="payment-success" class="payment-success hidden"><strong>Payment successful.</strong>Your Vinos order is confirmed and your wines will be shipped as soon as possible. Feel free to proceed with the chat.</div>

    <div class="footer">Vinos secure checkout powered by Vidos</div>
  </div>

  <script>
    const qrCodeEl = document.getElementById("qr-code");
    const statusEl = document.getElementById("status");
    const instructionsTextEl = document.getElementById("instructions-text");
    const authorizationLinkEl = document.getElementById("authorization-link");
    const paymentPanelEl = document.getElementById("payment-panel");
    const checkoutButtonEl = document.getElementById("checkout-button");
    const paymentSuccessEl = document.getElementById("payment-success");
    const POLL_INTERVAL_MS = 2000;
    const terminalStatuses = new Set(["verified", "rejected", "expired", "error", "completed"]);
    let latestToolOutput = null;
    let latestSessionId = null;
    let latestQrSvg = "";
    let latestAuthorizeUrl = "";
    let pollTimer = null;
    let rpcCounter = 0;
    let completionNotified = false;
    let paymentCompleted = false;
    const pendingRequests = new Map();

    function isJsonRpcMessage(message) {
      return Boolean(message && message.jsonrpc === "2.0");
    }

    function setStatus(text) {
      statusEl.textContent = text;
    }

    function setVerificationVisible(visible) {
      qrCodeEl.parentElement.classList.toggle("hidden", !visible);
      authorizationLinkEl.classList.toggle("hidden", !visible || !latestAuthorizeUrl);
    }

    function setPaymentVisible(visible) {
      paymentPanelEl.classList.toggle("hidden", !visible);
    }

    function setPaymentSuccess(visible) {
      paymentSuccessEl.classList.toggle("hidden", !visible);
      checkoutButtonEl.disabled = visible;
      checkoutButtonEl.textContent = visible ? "Paid" : "Pay now";
    }

    function normalizeToolOutput(raw) {
      if (!raw) return {};
      return raw.structuredContent ?? raw;
    }

    function buildStatusText(data) {
      const status = data?.status;
      const lifecycle = data?.verification?.lifecycle;

      if (status === "verified") {
        return "Verification complete. Continue in chat or finish payment below.";
      }

      if (status === "rejected") {
        return data?.verification?.lastError ?? "Verification was rejected. You can restart checkout to try again.";
      }

      if (status === "expired") {
        return "Verification session expired. Restart checkout to generate a fresh QR code.";
      }

      if (status === "error") {
        return data?.verification?.lastError ?? "Verification hit an error. Restart checkout to try again.";
      }

      if (status === "completed") {
        return "Checkout completed successfully.";
      }

      if (lifecycle === "authorized" || lifecycle === "completed") {
        return "Wallet consent received. Final verification checks are finishing now...";
      }

      if (lifecycle === "processing") {
        return "Wallet proof received. Finalizing age verification...";
      }

      if (lifecycle === "pending_wallet") {
        return "Waiting for wallet scan and consent.";
      }

      return "Scan the QR code with your wallet. This widget will keep checking automatically.";
    }

    function buildInstructionText(data) {
      const status = data?.status;

      if (status === "verified") {
        return "Verification succeeded. The agent can continue in chat, or you can finish payment below.";
      }

      if (status === "completed") {
        return "Payment completed successfully.";
      }

      if (status === "rejected" || status === "expired" || status === "error") {
        return "This verification session ended. Restart checkout if you want to try again.";
      }

      return "Scan this QR code with your EUDI Wallet app. Your digital identity will be used only to verify age eligibility.";
    }

    function stopPolling() {
      if (!pollTimer) return;
      window.clearInterval(pollTimer);
      pollTimer = null;
    }

    function startPolling(sessionId) {
      if (!sessionId || terminalStatuses.has(normalizeToolOutput(latestToolOutput)?.status)) {
        stopPolling();
        return;
      }

      if (pollTimer && latestSessionId === sessionId) {
        return;
      }

      stopPolling();
      pollTimer = window.setInterval(() => {
        void pollStatus(sessionId);
      }, POLL_INTERVAL_MS);
      void pollStatus(sessionId);
    }

    function rpcRequest(method, params) {
      return new Promise((resolve, reject) => {
        const id = "rpc-" + (++rpcCounter);
        pendingRequests.set(id, { resolve, reject });
        window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
        window.setTimeout(() => {
          const pending = pendingRequests.get(id);
          if (!pending) return;
          pendingRequests.delete(id);
          reject(new Error(method + " timed out"));
        }, 15000);
      });
    }

    function postHostNotification(method, params) {
      window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
    }

    async function notifyAgent(statusData) {
      if (completionNotified) return;
      completionNotified = true;

      const status = statusData?.status;
      const sessionId = statusData?.checkoutSessionId ?? latestSessionId ?? "unknown";
      const age = statusData?.verification?.ageCheck;
      const detail =
        status === "verified"
          ? age?.requiredAge
            ? "Age eligibility confirmed for " + age.requiredAge + "+ purchase."
            : "Age eligibility confirmed."
          : statusData?.verification?.lastError ?? "Verification session ended.";

      try {
        await rpcRequest("ui/update-model-context", {
          content: [
            {
              type: "text",
              text: "Checkout verification update for session " + sessionId + ": status=" + status + ". " + detail,
            },
          ],
        });
      } catch (_error) {
      }

      postHostNotification("ui/message", {
        role: "user",
        content: [
          {
            type: "text",
            text:
              status === "verified"
                ? "Wine age verification completed for checkout session " + sessionId + ". Please continue checkout."
                : "Wine age verification update for checkout session " + sessionId + ": " + detail,
          },
        ],
      });

    }

    async function pollStatus(sessionId) {
      try {
        const toolResult = window.openai?.callTool
          ? await window.openai.callTool("get_checkout_status", {
              checkoutSessionId: sessionId,
            })
          : await rpcRequest("tools/call", {
              name: "get_checkout_status",
              arguments: { checkoutSessionId: sessionId },
            }).then((response) => response?.result ?? response);
        render(toolResult);
      } catch (_error) {
        setStatus("Unable to refresh verification status right now. Still waiting for wallet completion...");
      }
    }

    function render(raw) {
      latestToolOutput = raw;
      const data = normalizeToolOutput(raw);
      const qrSvg = data?.qrSvg ?? latestQrSvg;
      const authorizeUrl = data?.authorization?.authorizeUrl ?? data?.authorizeUrl ?? latestAuthorizeUrl;
      latestSessionId = data?.checkoutSessionId ?? latestSessionId;
      latestQrSvg = qrSvg || latestQrSvg;
      latestAuthorizeUrl = authorizeUrl || latestAuthorizeUrl;

      if (qrSvg) {
        qrCodeEl.innerHTML = qrSvg;
      } else {
        qrCodeEl.innerHTML = '<div class="placeholder">QR code unavailable.</div>';
      }

      instructionsTextEl.textContent = buildInstructionText(data);
      setStatus(buildStatusText(data));
      setVerificationVisible(!(data?.status === 'verified' || data?.status === 'completed'));
      setPaymentVisible(data?.status === 'verified' || data?.status === 'completed');
      setPaymentSuccess(paymentCompleted || data?.status === 'completed');

      if (authorizeUrl) {
        authorizationLinkEl.classList.remove('hidden');
        authorizationLinkEl.innerHTML = '<a class="wallet-link" href="' + authorizeUrl + '" target="_blank" rel="noreferrer">Open Vinos in wallet</a>';
      } else {
        authorizationLinkEl.classList.add('hidden');
        authorizationLinkEl.textContent = '';
      }

      if (data?.status === 'verified' || data?.status === 'completed') {
        authorizationLinkEl.classList.add('hidden');
      }

      if (terminalStatuses.has(data?.status)) {
        stopPolling();
        void notifyAgent(data);
        return;
      }

      startPolling(latestSessionId);
    }

    render(window.openai?.toolOutput);

    window.addEventListener(
      'openai:set_globals',
      (event) => {
        render(event.detail?.globals?.toolOutput ?? window.openai?.toolOutput);
      },
      { passive: true }
    );

    window.addEventListener(
      'message',
      (event) => {
        if (event.source !== window.parent) return;
        const message = event.data;
        if (!isJsonRpcMessage(message)) return;

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
      { passive: true }
    );

    window.addEventListener(
      'message',
      (event) => {
        if (event.source !== window.parent) return;
        const message = event.data;
        if (!isJsonRpcMessage(message)) return;
        if (message.method !== 'ui/notifications/tool-result') return;
        render(message.params);
      },
      { passive: true }
    );

    checkoutButtonEl.addEventListener('click', () => {
      paymentCompleted = true;
      latestToolOutput = {
        structuredContent: {
          ...normalizeToolOutput(latestToolOutput),
          status: 'completed',
        },
      };
      render(latestToolOutput);
      setPaymentVisible(false);
    });
  </script>
</body>
</html>`;
}

export function registerVerificationWidgetResource(server: McpServer) {
	server.registerResource(
		"verification-widget",
		VERIFICATION_WIDGET_URI,
		{
			title: "Verification Widget",
			description: "QR code widget for wine checkout age verification.",
			mimeType: VERIFICATION_WIDGET_MIME_TYPE,
		},
		async (uri) => {
			return {
				contents: [
					{
						uri: uri.toString(),
						mimeType: VERIFICATION_WIDGET_MIME_TYPE,
						text: generateAppWidgetHtml(),
						_meta: {
							ui: {
								prefersBorder: true,
								domain: getWidgetDomain(),
								csp: getWidgetCsp(),
							},
							"openai/widgetDescription":
								"Displays the wine age-verification QR code and minimal verification context.",
							"openai/widgetPrefersBorder": true,
							"openai/widgetDomain": getWidgetDomain(),
							"openai/widgetCSP": {
								connect_domains: [],
								resource_domains: ["https://persistent.oaistatic.com"],
							},
						},
					},
				],
			};
		},
	);
}
