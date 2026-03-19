import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

export const VERIFICATION_WIDGET_URI = "ui://widget/verification.html";
export const VERIFICATION_WIDGET_MIME_TYPE = RESOURCE_MIME_TYPE;

export function getWidgetDomain(): string | undefined {
	const rawBaseUrl = process.env.PUBLIC_BASE_URL;

	if (!rawBaseUrl) {
		return undefined;
	}

	try {
		return new URL(rawBaseUrl).origin;
	} catch {
		return undefined;
	}
}

export function getWidgetCsp() {
	return {
		connectDomains: [],
		resourceDomains: [],
		frameDomains: [],
	};
}
