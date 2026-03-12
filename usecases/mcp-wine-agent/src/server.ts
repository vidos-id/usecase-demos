import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCheckoutTools } from "@/tools/checkout-tools";
import { registerShoppingTools } from "@/tools/shopping-tools";
import { registerVerificationWidgetResource } from "@/ui/verification-widget";

export function createServer() {
	const server = new McpServer(
		{
			name: "mcp-wine-agent",
			version: "0.0.1",
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	registerVerificationWidgetResource(server);
	registerShoppingTools(server);
	registerCheckoutTools(server);

	return server;
}
