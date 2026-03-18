import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Bot,
	CarFront,
	Check,
	CheckCircle2,
	Copy,
	ExternalLink,
	FileText,
	KeyRound,
	MapPinned,
	MessageSquare,
	QrCode,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { ChatGptCarRentalMockup } from "../components/chatgpt-car-rental-mockup";
import { cn } from "../lib/utils";
import { GuideLayout } from "./guide-layout";

const chatgptUrls = {
	advanced: "https://chatgpt.com/#settings/Connectors/Advanced",
	connectors: "https://chatgpt.com/#settings/Connectors",
	home: "https://chatgpt.com/",
	settings: "https://chatgpt.com/#settings",
} as const;

const openClawSkillUrl =
	"https://raw.githubusercontent.com/vidos-id/usecase-demos/main/usecases/car-rental/mcp/skill.md";

const openClawBootstrapPrompt = `Read ${openClawSkillUrl} and follow the instructions for this session.`;

const openClawFirstMessage =
	"I need a rental car in Tenerife for five days with room for luggage.";

const mcpServerUrl =
	import.meta.env.VITE_MCP_CAR_RENTAL_AGENT_URL ?? "http://localhost:30124/mcp";

const usageModes = [
	{
		icon: <Bot className="h-4 w-4" />,
		id: "chatgpt",
		label: "ChatGPT via MCP",
	},
	{
		icon: <span>🦞</span>,
		id: "openclaw",
		label: "OpenClaw via skill",
	},
] as const;

type UsageModeId = (typeof usageModes)[number]["id"];

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

function CarRentalUsageTabs({
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

function CarRentalInstructions({ activeMode }: { activeMode: UsageModeId }) {
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
							and then{" "}
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
							unpublished MCP apps.
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
							Return to{" "}
							<ExternalAnchor href={chatgptUrls.connectors}>
								Connectors
							</ExternalAnchor>{" "}
							and choose <strong>Create app</strong>.
						</StepItem>
						<StepItem number={2}>
							Use the fields below. Each value can be copied with one click.
						</StepItem>
						<StepItem number={3}>
							Choose <strong>Create</strong>. ChatGPT will fetch tools and the
							verification widget from the MCP server.
						</StepItem>
					</ol>
					<div className="grid gap-3 sm:grid-cols-2">
						<SetupCard
							label="Name"
							value="vidos-car-rental"
							description="Keep this value, or rename it to match your demo branding."
						/>
						<SetupCard
							label="Description"
							description="Leave this field empty for the demo."
						/>
						<SetupCard
							label="MCP Server URL"
							value={mcpServerUrl}
							description="Paste this URL. The agent will use it for search, booking, and verification state."
						/>
						<SetupCard
							label="Authentication"
							description="Select 'No Auth' - this MCP server does not require sign-in."
						/>
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<p className="mono-label mb-1">Step 3</p>
					<p className="text-sm text-muted-foreground">
						Try the booking flow in chat.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5">
					<ol className="space-y-3">
						<StepItem number={1}>
							Attach the app to a ChatGPT conversation.
						</StepItem>
						<StepItem number={2}>
							Use a natural prompt like{" "}
							<strong>"I need a rental car in Tenerife for five days."</strong>
						</StepItem>
						<StepItem number={3}>
							Pick one of the agent's text-first car suggestions, then ask it to
							book the car.
						</StepItem>
						<StepItem number={4}>
							Scan the wallet QR in the widget. After approval, the agent
							resumes automatically and confirms the pickup locker details.
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
						Load the car-rental skill into your OpenClaw conversation.
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
							The skill teaches OpenClaw how to initialize the MCP session,
							preserve the `mcp-session-id`, call the rental tools, and poll
							booking status.
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
						Ask for your first rental recommendation.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
					<ol className="space-y-3">
						<StepItem number={1}>
							After the skill is loaded, send a normal trip request to the
							agent.
						</StepItem>
						<StepItem number={2}>
							A good first message includes the destination, trip length, and
							whether you need luggage room.
						</StepItem>
						<StepItem number={3}>
							From there, OpenClaw can search cars, explain the best matches,
							and move into the fixed select-and-book flow.
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
						Use the skill through booking and verification.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5">
					<ol className="space-y-3">
						<StepItem number={1}>
							Ask OpenClaw to book the chosen car once you have picked a
							vehicle.
						</StepItem>
						<StepItem number={2}>
							The skill keeps the flow narrow: `search_cars`, `select_car`,
							`start_booking`, then `get_booking_status`.
						</StepItem>
						<StepItem number={3}>
							When verification starts, OpenClaw generates a QR from the
							returned authorization URL, sends it with `MEDIA:`, and continues
							polling proactively.
						</StepItem>
						<StepItem number={4}>
							After approval, OpenClaw confirms the booking reference, locker
							ID, PIN, and pickup instructions in chat.
						</StepItem>
					</ol>
				</div>
			</section>
		</>
	);
}

function CarRentalDemoOverview({ activeMode }: { activeMode: UsageModeId }) {
	return (
		<section className="space-y-4">
			<div>
				<p className="mono-label mb-1">What the demo shows</p>
				<p className="text-sm text-muted-foreground">
					{activeMode === "chatgpt"
						? "A travel booking flow where the agent stays primary and the widget handles only the trust-critical verification handoff."
						: "A text-first rental flow where OpenClaw drives the MCP server through a hosted skill and keeps the user oriented through verification."}
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<JourneyStep
					icon={<Bot className="h-5 w-5" />}
					title="Conversation-led search"
					description="The user gives destination and trip context. The agent ranks cars in plain text before moving to selection."
				/>
				<JourneyStep
					icon={<CarFront className="h-5 w-5" />}
					title="Server-owned booking context"
					description="Once a car is selected, the server records the booking session, vehicle requirements, and later verification state."
				/>
				<JourneyStep
					icon={<QrCode className="h-5 w-5" />}
					title={
						activeMode === "chatgpt"
							? "Wallet verification widget"
							: "Wallet QR handoff"
					}
					description={
						activeMode === "chatgpt"
							? "The widget appears only when booking starts. It shows the QR handoff and keeps polling until approval, rejection, expiry, or error."
							: "The skill turns the authorization URL into a QR, sends it to OpenClaw chat, and keeps polling status without waiting for another user message."
					}
				/>
				<JourneyStep
					icon={
						activeMode === "chatgpt" ? (
							<CheckCircle2 className="h-5 w-5" />
						) : (
							<KeyRound className="h-5 w-5" />
						)
					}
					title="Visible pickup handoff"
					description="After approval, the booking is confirmed with a reference, locker ID, PIN, and pickup instructions."
				/>
			</div>
		</section>
	);
}

function CarRentalRelatedGuides() {
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
							Install a compatible wallet for the verification step.
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
							Issue the PID and mDL credentials needed for booking approval.
						</p>
					</div>
					<ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-eu-blue" />
				</Link>
			</div>
		</section>
	);
}

export function McpCarRentalAgentPage() {
	const [activeMode, setActiveMode] = useState<UsageModeId>("chatgpt");

	return (
		<GuideLayout>
			<div className="space-y-12">
				<header className="space-y-4">
					<p className="mono-label">MCP Guide</p>
					<h1 className="heading-mixed">
						Set up the <strong>AI Car Rental Concierge</strong>
					</h1>
					<p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
						Use the demo either through ChatGPT via MCP or through OpenClaw via
						a hosted skill. In both flows, search and booking stay
						conversational before the wallet-backed licence check confirms
						pickup.
					</p>
				</header>

				<section className="space-y-6">
					<CarRentalUsageTabs
						activeMode={activeMode}
						onChange={setActiveMode}
					/>
					<CarRentalInstructions activeMode={activeMode} />
				</section>

				<CarRentalDemoOverview activeMode={activeMode} />

				<section className="space-y-4">
					<div>
						<p className="mono-label mb-1">Sample interaction</p>
						<p className="text-sm text-muted-foreground">
							A replay of the chat-first rental flow: search, selection,
							verification handoff, and pickup confirmation.
						</p>
					</div>
					<ChatGptCarRentalMockup variant={activeMode} />
				</section>

				<section className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
					<p className="mono-label">Demo prerequisites</p>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="rounded-xl bg-muted/50 p-4">
							<div className="flex items-center gap-2 text-sm font-semibold">
								<ShieldCheck className="h-4 w-4 text-eu-blue" />
								PID credential
							</div>
							<p className="mt-2 text-sm text-muted-foreground">
								Needed for age evaluation in the rental approval step.
							</p>
						</div>
						<div className="rounded-xl bg-muted/50 p-4">
							<div className="flex items-center gap-2 text-sm font-semibold">
								<MapPinned className="h-4 w-4 text-eu-blue" />
								Mobile driving licence
							</div>
							<p className="mt-2 text-sm text-muted-foreground">
								Needed to prove the required driving licence category and
								licence validity.
							</p>
						</div>
					</div>
				</section>

				<CarRentalRelatedGuides />
			</div>
		</GuideLayout>
	);
}
