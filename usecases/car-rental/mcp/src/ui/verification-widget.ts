import {
	RESOURCE_MIME_TYPE,
	registerAppResource,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getBuiltWidgetHtml } from "@/ui/widget-build";
import {
	getWidgetCsp,
	getWidgetDomain,
	RENTAL_WIDGET_MIME_TYPE,
	RENTAL_WIDGET_URI,
} from "@/ui/widget-config";

export { RENTAL_WIDGET_MIME_TYPE, RENTAL_WIDGET_URI } from "@/ui/widget-config";

export function registerRentalWidgetResource(server: McpServer) {
	registerAppResource(
		server,
		"car-rental-widget",
		RENTAL_WIDGET_URI,
		{
			title: "Car rental verification",
			description:
				"Wallet verification and booking approval widget for the rental demo.",
			mimeType: RESOURCE_MIME_TYPE,
		},
		async (uri) => {
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
								csp: getWidgetCsp(),
							},
						},
					},
				],
			};
		},
	);
}
