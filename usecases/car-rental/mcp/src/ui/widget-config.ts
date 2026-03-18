import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

export const RENTAL_WIDGET_URI = "ui://widget/car-rental-verification.html";
export const RENTAL_WIDGET_MIME_TYPE = RESOURCE_MIME_TYPE;

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
