import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

export const VERIFICATION_WIDGET_URI = "ui://widget/verification.html";
export const VERIFICATION_WIDGET_MIME_TYPE = RESOURCE_MIME_TYPE;
export const WIDGET_ASSETS_ROUTE = "/widget-assets";

export function getWidgetDomain(): string | undefined {
	const rawDomain =
		process.env.MCP_UI_DOMAIN ??
		process.env.WIDGET_UI_DOMAIN ??
		process.env.PUBLIC_WIDGET_DOMAIN;

	if (!rawDomain) {
		return undefined;
	}

	return rawDomain;
}

export function getWidgetCsp() {
	return {
		connectDomains: [],
		resourceDomains: [],
		frameDomains: [],
	};
}
