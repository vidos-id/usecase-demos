import { useSearch } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Globe, Ticket } from "lucide-react";
import { ChatGptTicketAgentMockup } from "../components/chatgpt-ticket-agent-mockup";
import { RelatedGuides } from "../components/mcp-shared-ui";
import { GuideLayout } from "./guide-layout";

const ticketAgentUrl =
	import.meta.env.VITE_TICKET_AGENT_URL ??
	"http://localhost:29752/ticket-agent/";

const normalizedTicketAgentUrl = ticketAgentUrl.endsWith("/")
	? ticketAgentUrl
	: `${ticketAgentUrl}/`;

const ticketAgentGuideUrl = new URL(
	"guide",
	normalizedTicketAgentUrl,
).toString();

function TicketAgentDemoOverview() {
	return (
		<section className="space-y-4">
			<div>
				<p className="mono-label mb-1">What the demo shows</p>
				<p className="text-sm text-muted-foreground">
					A ticket-booking flow where the user verifies with PID in VidoShow,
					issues a booking-only delegation credential over OID4VCI to the agent
					wallet, and the agent presents it only at the protected purchase step.
				</p>
			</div>
			<div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
				<p className="text-sm text-muted-foreground leading-relaxed">
					The detailed setup now lives inside the VidoShow demo itself: identity
					verification, OID4VCI delegation-offer creation, OpenClaw skill
					bootstrap, `openid4vc-wallet` wallet initialization, credential
					redemption, and the final booking flow.
				</p>
				<p className="text-sm text-muted-foreground leading-relaxed">
					`openid4vc-wallet` is the CLI from the Vidos OpenID4VC tools repo for
					wallet bootstrap and OID4VCI/OID4VP interactions, available at{" "}
					<a
						href="https://github.com/vidos-id/openid4vc-tools"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary underline-offset-4 hover:underline"
					>
						github.com/vidos-id/openid4vc-tools
					</a>
					. This ticket-agent demo itself issues the delegated credential with
					the `@vidos-id/openid4vc-issuer` package from the same repository.
				</p>
				<a
					href={ticketAgentGuideUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-3 rounded-xl bg-eu-blue px-4 py-3 text-sm font-medium text-eu-blue-foreground no-underline transition-all duration-200 hover:bg-eu-blue-dark hover:translate-x-px"
				>
					<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
						<Globe className="h-4 w-4" />
					</span>
					<span>Open the full VidoShow guide</span>
					<ArrowRight className="h-4 w-4 opacity-70" />
				</a>
			</div>
		</section>
	);
}

function TicketAgentRelatedGuides() {
	return (
		<RelatedGuides credentialDescription="Issue your PID first, then create the booking-only delegation credential inside VidoShow for agent onboarding." />
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
						Use VidoShow with OpenClaw to onboard a ticket-booking agent through
						a streamlined OID4VCI flow. This home page keeps the quick overview
						and sample chat, while the full step-by-step setup now lives
						directly inside the VidoShow demo.
					</p>
				</header>

				<TicketAgentDemoOverview />

				<section className="space-y-4">
					<div>
						<p className="mono-label mb-1">Sample interaction</p>
						<p className="text-sm text-muted-foreground">
							A replay of the current flow: load the skill, initialize the agent
							wallet with `openid4vc-wallet`, share the OID4VCI offer, let the
							agent redeem the delegated credential, then search, book, and
							confirm.
						</p>
					</div>
					<ChatGptTicketAgentMockup variant="openclaw" />
				</section>

				<section className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
					<p className="mono-label">Where to continue</p>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Open the in-demo guide for the actual setup steps, including PID
						verification, delegation-offer creation, the OpenClaw bootstrap
						prompt, and agent wallet onboarding.
					</p>
					<a
						href={ticketAgentGuideUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-3 rounded-xl bg-eu-blue px-4 py-3 text-sm font-medium text-eu-blue-foreground no-underline transition-all duration-200 hover:bg-eu-blue-dark hover:translate-x-px"
					>
						<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
							<Ticket className="h-4 w-4" />
						</span>
						<span>Open VidoShow guide</span>
						<ExternalLink className="h-4 w-4 opacity-70" />
					</a>
				</section>

				<TicketAgentRelatedGuides />
			</div>
		</GuideLayout>
	);
}
