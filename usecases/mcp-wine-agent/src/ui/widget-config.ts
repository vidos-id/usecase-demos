import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

export const VERIFICATION_WIDGET_URI = "ui://widget/verification.html";
export const VERIFICATION_WIDGET_MIME_TYPE = RESOURCE_MIME_TYPE;
export const WIDGET_ASSETS_ROUTE = "/widget-assets";

const DEFAULT_PUBLIC_BASE_URL = "https://mcp-wine-agent.example.com";

function getConfiguredPublicBaseUrl(): URL {
	const rawUrl =
		process.env.PUBLIC_BASE_URL ??
		process.env.PUBLIC_SERVER_URL ??
		process.env.WIDGET_DOMAIN ??
		DEFAULT_PUBLIC_BASE_URL;

	return new URL(rawUrl);
}

export function getPublicBaseUrl(): string {
	const url = getConfiguredPublicBaseUrl();
	const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
	return `${url.origin}${pathname}`;
}

export function getWidgetDomain(): string {
	return getConfiguredPublicBaseUrl().origin;
}

export function getWidgetOrigin(): string {
	return getConfiguredPublicBaseUrl().origin;
}

export function getWidgetCsp() {
	return {
		connectDomains: [],
		resourceDomains: [],
		frameDomains: [],
	};
}
