import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCarRentalTools } from "@/tools/car-rental-tools";
import { registerRentalWidgetResource } from "@/ui/verification-widget";

export function createServer() {
	const server = new McpServer(
		{
			name: "mcp-car-rental-agent",
			version: "0.0.1",
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	registerRentalWidgetResource(server);
	registerCarRentalTools(server);

	return server;
}
