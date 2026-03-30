import { useSearch } from "@tanstack/react-router";
import {
	ExternalLink,
	Globe,
	KeyRound,
	Search,
	ShieldCheck,
	Ticket,
} from "lucide-react";
import { ChatGptTicketAgentMockup } from "../components/chatgpt-ticket-agent-mockup";
import {
	CheckCircle2,
	CopyableField,
	FileText,
	JourneyStep,
	MessageSquare,
	RelatedGuides,
	StepItem,
} from "../components/mcp-shared-ui";
import { GuideLayout } from "./guide-layout";

const openClawSkillUrl =
	"https://raw.githubusercontent.com/vidos-id/usecase-demos/main/usecases/ticket-agent/server/skill.md";

const ticketAgentUrl =
	import.meta.env.VITE_TICKET_AGENT_URL ??
	"http://localhost:29752/ticket-agent/";

const openClawBootstrapPrompt = `Read ${openClawSkillUrl} and follow the instructions for this session.`;

const openClawFirstMessage =
	"Find me a concert in Berlin and book 2 tickets if seats are available together.";

function TicketAgentInstructions() {
	return (
		<>
			<section className="space-y-4">
				<div>
					<p className="mono-label mb-1">Step 1</p>
					<p className="text-sm text-muted-foreground">
						Open the VidoShow web app first and keep it beside the chat.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
					<ol className="space-y-3">
						<StepItem number={1}>Open your OpenClaw chat.</StepItem>
						<StepItem number={2}>
							Open the VidoShow web app in a second tab or window before you
							start the agent flow.
						</StepItem>
						<StepItem number={3}>
							The web app has a simple guided flow that is easy to follow for
							agent onboarding, delegation credential issuance, and booking
							support.
						</StepItem>
					</ol>
					<a
						href={ticketAgentUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-3 rounded-xl bg-eu-blue px-4 py-3 text-sm font-medium text-eu-blue-foreground no-underline transition-all duration-200 hover:bg-eu-blue-dark hover:translate-x-px"
					>
						<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
							<Globe className="h-4 w-4" />
						</span>
						<span>Open VidoShow web app</span>
						<ExternalLink className="h-4 w-4 opacity-70" />
					</a>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<p className="mono-label mb-1">Step 2</p>
					<p className="text-sm text-muted-foreground">
						Load the VidoShow skill into your OpenClaw conversation.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
					<ol className="space-y-3">
						<StepItem number={1}>
							Send the bootstrap instruction below so the agent reads the hosted
							skill file and follows it for this session.
						</StepItem>
						<StepItem number={2}>
							The skill teaches OpenClaw how to initialize the wallet, import a
							directly issued delegation credential, search events, create a
							booking, present the credential, and poll booking status.
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
					<p className="mono-label mb-1">Step 3</p>
					<p className="text-sm text-muted-foreground">
						Complete the delegation bootstrap.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5">
					<ol className="space-y-3">
						<StepItem number={1}>
							Ask the agent to initialize its wallet and wait for the returned
							public key.
						</StepItem>
						<StepItem number={2}>
							Paste that key into the VidoShow web app&apos;s onboarding section
							to mint the delegation credential.
						</StepItem>
						<StepItem number={3}>
							Paste the resulting dc+sd-jwt credential string back into OpenClaw
							so it can import it directly. This guide is not using the OID4VCI
							`receive` flow yet.
						</StepItem>
					</ol>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<p className="mono-label mb-1">Step 4</p>
					<p className="text-sm text-muted-foreground">
						Let the agent book the event for you.
					</p>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
					<ol className="space-y-3">
						<StepItem number={1}>
							Ask for an event recommendation, then confirm the one you want.
						</StepItem>
						<StepItem number={2}>
							The skill will call the event search and booking APIs, present the
							delegation credential during authorization, and keep polling until
							the booking resolves.
						</StepItem>
						<StepItem number={3}>
							At the end, OpenClaw confirms the event, quantity, and delegator
							name that the booking was made under.
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
		</>
	);
}

function TicketAgentDemoOverview() {
	return (
		<section className="space-y-4">
			<div>
				<p className="mono-label mb-1">What the demo shows</p>
				<p className="text-sm text-muted-foreground">
					A delegation-first booking flow where the user authorizes an AI agent
					to buy tickets and the credential is presented only at the
					trust-critical purchase step.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<JourneyStep
					icon={<KeyRound className="h-5 w-5" />}
					title="Agent wallet bootstrap"
					description="The agent creates its own wallet, shares a public key, and waits for delegated authority from the user."
				/>
				<JourneyStep
					icon={<ShieldCheck className="h-5 w-5" />}
					title="Delegation credential import"
					description="The user mints a delegation credential from their verified identity and pastes it back into the agent conversation."
				/>
				<JourneyStep
					icon={<Search className="h-5 w-5" />}
					title="Conversational event search"
					description="The agent searches events in plain language, summarizes the best option, and asks for booking confirmation."
				/>
				<JourneyStep
					icon={<Ticket className="h-5 w-5" />}
					title="Autonomous delegated purchase"
					description="During booking, the agent presents the delegation credential, polls booking status, and confirms the purchase under the delegator's identity."
				/>
			</div>
		</section>
	);
}

function TicketAgentRelatedGuides() {
	return (
		<RelatedGuides credentialDescription="Issue the PID and delegation credential needed to authorize VidoShow." />
	);
}

export function TicketAgentGuidePage() {
	useSearch({ from: "/ticket-agent-guide" });

	return (
		<GuideLayout>
			<div className="space-y-12">
				<header className="space-y-4">
					<p className="mono-label">Agent Guide</p>
					<h1 className="heading-mixed">
						Set up <strong>VidoShow</strong>
					</h1>
					<p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
						Use a delegation-based agent that can search events and complete a
						purchase on your behalf after you issue it a wallet-bound delegation
						credential. The guide and the web app work together, so start in the
						web app and keep both open side by side.
					</p>
				</header>

				<section className="space-y-6">
					<TicketAgentInstructions />
				</section>

				<TicketAgentDemoOverview />

				<section className="space-y-4">
					<div>
						<p className="mono-label mb-1">Sample interaction</p>
						<p className="text-sm text-muted-foreground">
							A replay of the delegation flow: wallet bootstrap, credential
							import, event search, delegated booking, and confirmation.
						</p>
					</div>
					<ChatGptTicketAgentMockup variant="openclaw" />
				</section>

				<section className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
					<p className="mono-label">Demo prerequisites</p>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="rounded-xl bg-muted/50 p-4">
							<div className="flex items-center gap-2 text-sm font-semibold">
								<FileText className="h-4 w-4 text-eu-blue" />
								OpenClaw guide flow
							</div>
							<p className="mt-2 text-sm text-muted-foreground">
								Use the hosted skill and chat flow together with the VidoShow
								web app. The app provides a simple guided flow that is easy to
								follow while you onboard the agent and issue the credential.
							</p>
						</div>
						<div className="rounded-xl bg-muted/50 p-4">
							<div className="flex items-center gap-2 text-sm font-semibold">
								<CheckCircle2 className="h-4 w-4 text-eu-blue" />
								PID + delegation credential
							</div>
							<p className="mt-2 text-sm text-muted-foreground">
								The user needs a verified identity and must mint a delegation
								credential before the agent can complete ticket purchase.
							</p>
						</div>
					</div>
				</section>

				<TicketAgentRelatedGuides />
			</div>
		</GuideLayout>
	);
}
