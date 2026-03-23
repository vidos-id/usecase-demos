import { createHash } from "node:crypto";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

export const VERIFICATION_WIDGET_URI = "ui://widget/verification.html";
export const VERIFICATION_WIDGET_MIME_TYPE = RESOURCE_MIME_TYPE;

/**
 * Claude Desktop requires ui.domain in the format "{hash}.claudemcpcontent.com".
 * The hash is sha256(mcpUrl).slice(0, 32), where mcpUrl is the full MCP endpoint URL.
 */
export function getWidgetDomain(): string | undefined {
	const rawBaseUrl = process.env.PUBLIC_BASE_URL;
	const mcpPath = process.env.MCP_PATH ?? "/mcp";

	if (!rawBaseUrl) {
		return undefined;
	}

	try {
		const mcpUrl = new URL(mcpPath, rawBaseUrl).toString();
		const hash = createHash("sha256").update(mcpUrl).digest("hex").slice(0, 32);
		return `${hash}.claudemcpcontent.com`;
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
