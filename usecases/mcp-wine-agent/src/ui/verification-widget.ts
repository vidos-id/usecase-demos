import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import QRCode from "qrcode";
import { getBuiltWidgetHtml } from "@/ui/widget-build";
import {
	getWidgetCsp,
	getWidgetDomain,
	VERIFICATION_WIDGET_MIME_TYPE,
	VERIFICATION_WIDGET_URI,
} from "@/ui/widget-config";

export {
	VERIFICATION_WIDGET_MIME_TYPE,
	VERIFICATION_WIDGET_URI,
} from "@/ui/widget-config";

const WINE_PRIMARY = "#722F37";

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
			const widgetCsp = getWidgetCsp();

			return {
				contents: [
					{
						uri: uri.toString(),
						mimeType: VERIFICATION_WIDGET_MIME_TYPE,
						text: await getBuiltWidgetHtml(),
						_meta: {
							ui: {
								prefersBorder: true,
								domain: getWidgetDomain(),
								csp: widgetCsp,
							},
							"openai/widgetDescription":
								"Displays the wine age-verification QR code and minimal verification context.",
							"openai/widgetPrefersBorder": true,
							"openai/widgetDomain": getWidgetDomain(),
							"openai/widgetCSP": {
								connect_domains: widgetCsp.connectDomains,
								resource_domains: widgetCsp.resourceDomains,
							},
						},
					},
				],
			};
		},
	);
}
