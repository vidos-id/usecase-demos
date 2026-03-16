export const VERIFICATION_WIDGET_URI = "ui://widget/verification.html";
export const VERIFICATION_WIDGET_MIME_TYPE = "text/html;profile=mcp-app";
export const WIDGET_ASSETS_ROUTE = "/widget-assets";

export function getWidgetDomain(): string {
	return process.env.WIDGET_DOMAIN ?? "https://mcp-wine-agent.example.com";
}

export function getWidgetOrigin(): string {
	return new URL(getWidgetDomain()).origin;
}

export function getWidgetCsp() {
	return {
		connectDomains: [],
		resourceDomains: [getWidgetOrigin(), "https://persistent.oaistatic.com"],
	};
}
