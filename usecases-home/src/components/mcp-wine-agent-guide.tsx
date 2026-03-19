import type { UsageModeId } from "./mcp-shared-ui";
import {
	Bot,
	CheckCircle2,
	CopyableField,
	chatgptUrls,
	ExternalAnchor,
	FileText,
	JourneyStep,
	MessageSquare,
	QrCode,
	RelatedGuides,
	SetupCard,
	ShoppingCart,
	StepItem,
	UsageModeTabs,
	usageModes,
} from "./mcp-shared-ui";

export { usageModes, type UsageModeId };

const openClawSkillUrl =
	"https://raw.githubusercontent.com/vidos-id/usecase-demos/main/usecases/wine-shop/mcp/skill.md";

const openClawBootstrapPrompt = `Read ${openClawSkillUrl} and follow the instructions for this session.`;

const openClawFirstMessage = "Give me suggestions for a red wine.";

export function McpWineUsageTabs({
	activeMode,
	onChange,
}: {
	activeMode: UsageModeId;
	onChange: (mode: UsageModeId) => void;
}) {
	return <UsageModeTabs activeMode={activeMode} onChange={onChange} />;
}

export function McpWineInstructions({
	activeMode,
	mcpServerUrl,
}: {
	activeMode: UsageModeId;
	mcpServerUrl: string;
}) {
	return activeMode === "chatgpt" ? (
		<>
			<section className="space-y-4">
				<div>
					<p className="mono-label mb-1">Step 1</p>
					<p className="text-sm text-muted-foreground">
						Enable developer mode in ChatGPT.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5">
					<ol className="space-y-3">
						<StepItem number={1}>
							Open{" "}
							<ExternalAnchor href={chatgptUrls.home}>
								chatgpt.com
							</ExternalAnchor>{" "}
							and then open{" "}
							<ExternalAnchor href={chatgptUrls.settings}>
								Settings
							</ExternalAnchor>
							.
						</StepItem>
						<StepItem number={2}>
							Go to{" "}
							<ExternalAnchor href={chatgptUrls.connectors}>
								Connectors
							</ExternalAnchor>{" "}
							and then{" "}
							<ExternalAnchor href={chatgptUrls.advanced}>
								Advanced
							</ExternalAnchor>
							.
						</StepItem>
						<StepItem number={3}>
							Turn on <strong>Developer mode</strong> so ChatGPT can install
							unpublished apps.
						</StepItem>
					</ol>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<p className="mono-label mb-1">Step 2</p>
					<p className="text-sm text-muted-foreground">
						Create the MCP app in ChatGPT.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
					<ol className="space-y-3">
						<StepItem number={1}>
							Go back to{" "}
							<ExternalAnchor href={chatgptUrls.connectors}>
								Connectors
							</ExternalAnchor>{" "}
							and choose <strong>Create app</strong>.
						</StepItem>
						<StepItem number={2}>
							Use the fields below. Each value can be copied with one click.
						</StepItem>
						<StepItem number={3}>
							Choose <strong>Create</strong>. ChatGPT will fetch the app
							metadata and capabilities from the MCP server.
						</StepItem>
						<StepItem number={4}>
							After creation, confirm the app appears under{" "}
							<strong>Enabled Apps</strong>. If setup fails, contact Vidos
							support.
						</StepItem>
					</ol>
					<div className="grid gap-3 sm:grid-cols-2">
						<SetupCard
							label="Name"
							value="vidos-wine-store"
							description="Keep this value, or rename it to match your branding such as Vinos Store."
						/>
						<SetupCard
							label="Description"
							description="Leave this field empty for the demo."
						/>
						<SetupCard
							label="MCP Server URL"
							value={mcpServerUrl}
							description="Paste this URL — the server is already hosted and ready."
						/>
						<SetupCard
							label="Authentication"
							description="Select 'No Auth' — this MCP server does not require sign-in."
						/>
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<p className="mono-label mb-1">Step 3</p>
					<p className="text-sm text-muted-foreground">
						Start using the app in a ChatGPT conversation.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5">
					<ol className="space-y-3">
						<StepItem number={1}>
							Return to the ChatGPT chat interface.
						</StepItem>
						<StepItem number={2}>
							Click the <strong>+</strong> button in the composer.
						</StepItem>
						<StepItem number={3}>
							Open <strong>More</strong> and select the app you just created.
						</StepItem>
						<StepItem number={4}>
							Once selected, ChatGPT can use the wine store tools exposed by the
							MCP server.
						</StepItem>
					</ol>
				</div>
			</section>
		</>
	) : (
		<>
			<section className="space-y-4">
				<div>
					<p className="mono-label mb-1">Step 1</p>
					<p className="text-sm text-muted-foreground">
						Load the wine store skill into your OpenClaw conversation.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
					<ol className="space-y-3">
						<StepItem number={1}>Open your OpenClaw chat.</StepItem>
						<StepItem number={2}>
							Send the bootstrap instruction below so the agent reads the hosted
							skill file and follows it for this session.
						</StepItem>
						<StepItem number={3}>
							The agent should answer with the actions it can take, such as
							searching wines, managing a cart, and starting checkout.
						</StepItem>
					</ol>
					<div className="rounded-2xl border border-eu-blue/20 bg-eu-blue-light/40 p-4">
						<div className="flex items-center gap-2 text-sm font-semibold text-eu-blue">
							<FileText className="h-4 w-4" />
							Instruction to copy
						</div>
						<CopyableField
							value={openClawBootstrapPrompt}
							label="OpenClaw bootstrap prompt"
						/>
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<p className="mono-label mb-1">Step 2</p>
					<p className="text-sm text-muted-foreground">
						Ask for your first wine suggestion.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
					<ol className="space-y-3">
						<StepItem number={1}>
							After the skill is loaded, send a normal shopping request to the
							agent.
						</StepItem>
						<StepItem number={2}>
							A good first message is a simple recommendation request for red
							wine.
						</StepItem>
						<StepItem number={3}>
							From there, OpenClaw can search the catalog, suggest bottles, and
							help you build a cart.
						</StepItem>
					</ol>
					<div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
						<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
							<MessageSquare className="h-4 w-4" />
							Sample first message
						</div>
						<CopyableField
							value={openClawFirstMessage}
							label="OpenClaw first message"
						/>
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<p className="mono-label mb-1">Step 3</p>
					<p className="text-sm text-muted-foreground">
						Use the API flow through checkout.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5">
					<ol className="space-y-3">
						<StepItem number={1}>
							Ask OpenClaw to add a wine to your cart once you have picked a
							bottle.
						</StepItem>
						<StepItem number={2}>
							When you are ready, ask it to start checkout. The skill handles
							the wine store API sessions and verification flow.
						</StepItem>
						<StepItem number={3}>
							If the store requires age verification, OpenClaw will send a QR
							code and keep polling until checkout resolves.
						</StepItem>
					</ol>
				</div>
			</section>
		</>
	);
}

export function McpWineDemoOverview() {
	return (
		<section className="space-y-4">
			<div>
				<p className="mono-label mb-1">What the demo shows</p>
				<p className="text-sm text-muted-foreground">
					A conversational shopping flow where ChatGPT uses MCP tools and the UI
					handles the age-verification handoff.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<JourneyStep
					icon={<Bot className="h-5 w-5" />}
					title="Conversation-led discovery"
					description="The user asks for wine recommendations, and the agent searches the wine store before suggesting matching bottles."
				/>
				<JourneyStep
					icon={<ShoppingCart className="h-5 w-5" />}
					title="Tool-driven cart actions"
					description="When the user picks a bottle, the agent adds it to the cart and offers to move into checkout."
				/>
				<JourneyStep
					icon={<QrCode className="h-5 w-5" />}
					title="Age verification in UI"
					description="During checkout, the app presents a verification widget. The user scans the QR code with a wallet and proves legal age."
				/>
				<JourneyStep
					icon={<CheckCircle2 className="h-5 w-5" />}
					title="Purchase completion"
					description="After verification succeeds, the user confirms payment details and completes the order."
				/>
			</div>
		</section>
	);
}

export function McpWineRelatedGuides() {
	return <RelatedGuides />;
}
