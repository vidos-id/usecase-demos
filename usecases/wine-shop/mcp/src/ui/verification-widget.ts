import {
	RESOURCE_MIME_TYPE,
	registerAppResource,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getBuiltWidgetHtml } from "@/ui/widget-build";
import {
	getWidgetCsp,
	getWidgetDomain,
	VERIFICATION_WIDGET_URI,
} from "@/ui/widget-config";

export {
	VERIFICATION_WIDGET_MIME_TYPE,
	VERIFICATION_WIDGET_URI,
} from "@/ui/widget-config";

export function registerVerificationWidgetResource(server: McpServer) {
	registerAppResource(
		server,
		"verification-widget",
		VERIFICATION_WIDGET_URI,
		{
			title: "Verification Widget",
			description: "QR code widget for wine checkout age verification.",
			mimeType: RESOURCE_MIME_TYPE,
		},
		async (uri) => {
			const widgetCsp = getWidgetCsp();
			const widgetDomain = getWidgetDomain();

			return {
				contents: [
					{
						uri: uri.toString(),
						mimeType: RESOURCE_MIME_TYPE,
						text: await getBuiltWidgetHtml(),
						_meta: {
							ui: {
								prefersBorder: true,
								...(widgetDomain ? { domain: widgetDomain } : {}),
								csp: widgetCsp,
							},
						},
					},
				],
			};
		},
	);
}
