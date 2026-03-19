import { useState } from "react";
import { ChatGptWineMockup } from "../components/chatgpt-wine-mockup";
import {
	McpWineDemoOverview,
	McpWineInstructions,
	McpWineRelatedGuides,
	McpWineUsageTabs,
	type UsageModeId,
} from "../components/mcp-wine-agent-guide";
import { GuideLayout } from "./guide-layout";

const mcpServerUrl =
	import.meta.env.VITE_MCP_WINE_AGENT_URL ??
	"https://mcp-wine-agent.demo.vidos.id/mcp";

export function McpWineAgentPage() {
	const [activeMode, setActiveMode] = useState<UsageModeId>("chatgpt");

	return (
		<GuideLayout>
			<div className="space-y-12">
				<header className="space-y-4">
					<p className="mono-label">MCP Guide</p>
					<h1 className="heading-mixed">
						Set up the <strong>AI Wine Concierge</strong>
					</h1>
					<p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
						Use the demo either through ChatGPT via MCP or through OpenClaw via
						the wine store API skill. In both flows, you can browse wines and
						complete an age-verified checkout directly from chat.
					</p>
				</header>

				<section className="space-y-6">
					<McpWineUsageTabs activeMode={activeMode} onChange={setActiveMode} />
					<McpWineInstructions
						activeMode={activeMode}
						mcpServerUrl={mcpServerUrl}
					/>
				</section>

				<McpWineDemoOverview />

				<section className="space-y-4">
					<div>
						<p className="mono-label mb-1">Sample interaction</p>
						<p className="text-sm text-muted-foreground">
							A premium replay of the actual experience: chat, tool call, cart
							update, and wallet-based age proof.
						</p>
					</div>
					<ChatGptWineMockup variant={activeMode} />
				</section>

				<McpWineRelatedGuides />
			</div>
		</GuideLayout>
	);
}
