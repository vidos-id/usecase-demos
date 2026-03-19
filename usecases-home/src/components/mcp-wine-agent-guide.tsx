import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Bot,
	Check,
	CheckCircle2,
	Copy,
	ExternalLink,
	FileText,
	MessageSquare,
	QrCode,
	ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

const chatgptUrls = {
	home: "https://chatgpt.com/",
	settings: "https://chatgpt.com/#settings",
	connectors: "https://chatgpt.com/#settings/Connectors",
	advanced: "https://chatgpt.com/#settings/Connectors/Advanced",
} as const;

const openClawSkillUrl =
	"https://raw.githubusercontent.com/vidos-id/usecase-demos/main/usecases/wine-shop/mcp/skill.md";

const openClawBootstrapPrompt = `Read ${openClawSkillUrl} and follow the instructions for this session.`;

const openClawFirstMessage = "Give me suggestions for a red wine.";

export const usageModes = [
	{
		id: "chatgpt",
		label: "ChatGPT via MCP",
		icon: <Bot className="h-4 w-4" />,
	},
	{
		id: "openclaw",
		label: "OpenClaw via API",
		icon: <span>🦞</span>,
	},
] as const;

export type UsageModeId = (typeof usageModes)[number]["id"];

function ExternalAnchor({
	href,
	children,
	className = "",
}: {
	href: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={[
				"inline-flex items-center gap-1.5 text-eu-blue underline underline-offset-2 hover:text-eu-blue-dark transition-colors",
				className,
			].join(" ")}
		>
			{children}
			<ExternalLink className="h-3.5 w-3.5" />
			<span className="sr-only">Opens in new tab</span>
		</a>
	);
}

function StepItem({
	number,
	children,
}: {
	number: number;
	children: React.ReactNode;
}) {
	return (
		<li className="flex gap-3">
			<span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-mono font-bold text-muted-foreground shrink-0">
				{number}
			</span>
			<span className="text-foreground/80">{children}</span>
		</li>
	);
}

function CopyableField({ value, label }: { value: string; label: string }) {
	const [copied, setCopied] = useState(false);

	const copyValue = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div className="mt-2 rounded-xl border border-border/60 bg-muted/60 px-3 py-3">
			<div className="flex items-start gap-3">
				<p className="min-w-0 flex-1 break-all font-mono text-sm text-foreground">
					{value}
				</p>
				<button
					type="button"
					onClick={copyValue}
					aria-label={`Copy ${label}`}
					className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:border-eu-blue/40 hover:text-eu-blue"
				>
					{copied ? (
						<Check className="h-4 w-4 text-green-600" />
					) : (
						<Copy className="h-4 w-4" />
					)}
				</button>
			</div>
		</div>
	);
}

function SetupCard({
	label,
	value,
	description,
}: {
	label: string;
	value?: string;
	description: string;
}) {
	return (
		<div className="rounded-2xl border border-border/60 bg-background p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
			<p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
				{label}
			</p>
			{value ? (
				<CopyableField value={value} label={label} />
			) : (
				<p className="mt-2 text-sm italic text-muted-foreground/70">
					No value needed
				</p>
			)}
			<p className="mt-3 text-sm text-muted-foreground leading-relaxed">
				{description}
			</p>
		</div>
	);
}

function JourneyStep({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="rounded-2xl border border-border/60 bg-card p-4">
			<div className="flex items-start gap-3">
				<div className="h-10 w-10 rounded-xl bg-eu-blue-light flex items-center justify-center text-eu-blue shrink-0">
					{icon}
				</div>
				<div>
					<h3 className="font-semibold">{title}</h3>
					<p className="mt-1 text-sm text-muted-foreground leading-relaxed">
						{description}
					</p>
				</div>
			</div>
		</div>
	);
}

export function McpWineUsageTabs({
	activeMode,
	onChange,
}: {
	activeMode: UsageModeId;
	onChange: (mode: UsageModeId) => void;
}) {
	return (
		<div>
			<p className="mono-label mb-4">Choose your flow</p>
			<div className="flex gap-2 rounded-xl border border-border/60 bg-muted/50 p-1 w-fit">
				{usageModes.map((mode) => (
					<button
						key={mode.id}
						type="button"
						onClick={() => onChange(mode.id)}
						className={cn(
							"flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
							activeMode === mode.id
								? "bg-background border border-border/60 shadow-sm text-eu-blue"
								: "text-muted-foreground hover:bg-background/50",
						)}
					>
						{mode.icon}
						{mode.label}
					</button>
				))}
			</div>
		</div>
	);
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
	return (
		<section className="pt-4 border-t border-border/40">
			<p className="mono-label mb-3">Related guides</p>
			<div className="grid gap-4 sm:grid-cols-2">
				<Link
					to="/wallet-setup"
					className="group flex items-center justify-between rounded-xl border border-border/60 p-5 transition-colors hover:border-eu-blue/40"
				>
					<div>
						<p className="font-semibold">Wallet Setup</p>
						<p className="mt-0.5 text-sm text-muted-foreground">
							Install a compatible wallet for the age-verification step.
						</p>
					</div>
					<ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-eu-blue" />
				</Link>
				<Link
					to="/credential-prep"
					className="group flex items-center justify-between rounded-xl border border-border/60 p-5 transition-colors hover:border-eu-blue/40"
				>
					<div>
						<p className="font-semibold">Credential Preparation</p>
						<p className="mt-0.5 text-sm text-muted-foreground">
							Issue the credential needed for the verification widget.
						</p>
					</div>
					<ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-eu-blue" />
				</Link>
			</div>
		</section>
	);
}
