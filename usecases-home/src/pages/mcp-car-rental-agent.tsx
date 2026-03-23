import { useNavigate, useSearch } from "@tanstack/react-router";
import {
	Bot,
	CarFront,
	CheckCircle2,
	KeyRound,
	MapPinned,
	QrCode,
	ShieldCheck,
} from "lucide-react";
import { useCallback } from "react";
import { ChatGptCarRentalMockup } from "../components/chatgpt-car-rental-mockup";
import {
	CopyableField,
	chatgptUrls,
	ExternalAnchor,
	FileText,
	JourneyStep,
	MessageSquare,
	RelatedGuides,
	SetupCard,
	StepItem,
	type UsageModeId,
	UsageModeTabs,
	usageModes,
} from "../components/mcp-shared-ui";
import { GuideLayout } from "./guide-layout";

export { usageModes, type UsageModeId };

const openClawSkillUrl =
	"https://raw.githubusercontent.com/vidos-id/usecase-demos/main/usecases/car-rental/mcp/skill.md";

const openClawBootstrapPrompt = `Read ${openClawSkillUrl} and follow the instructions for this session.`;

const openClawFirstMessage =
	"I need a rental car in Tenerife for five days with room for luggage.";

const mcpServerUrl =
	import.meta.env.VITE_MCP_CAR_RENTAL_AGENT_URL ?? "https://mcp-car-rent.demo.vidos.id/mcp";

function CarRentalUsageTabs({
	activeMode,
	onChange,
}: {
	activeMode: UsageModeId;
	onChange: (mode: UsageModeId) => void;
}) {
	return <UsageModeTabs activeMode={activeMode} onChange={onChange} />;
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
		<RelatedGuides credentialDescription="Issue the PID and mDL credentials needed for booking approval." />
	);
}

export function McpCarRentalAgentPage() {
	const { agent } = useSearch({ from: "/mcp-car-rental-agent" });
	const navigate = useNavigate({ from: "/mcp-car-rental-agent" });
	const activeMode: UsageModeId = agent ?? "chatgpt";
	const setActiveMode = useCallback(
		(mode: UsageModeId) => {
			navigate({ search: { agent: mode }, replace: true });
		},
		[navigate],
	);

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
