import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Check,
	ChevronRight,
	Copy,
	Fingerprint,
	KeyRound,
	Shield,
	ShieldCheck,
	Sparkles,
	Terminal,
	Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { useClipboard } from "vidos-web/clipboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/_app/guide")({
	component: GuidePage,
});

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const openClawSkillUrl =
	"https://raw.githubusercontent.com/vidos-id/usecase-demos/main/usecases/ticket-agent/server/skill.md";

const openClawBootstrapPrompt = `Read ${openClawSkillUrl} and follow the instructions for this session.`;

const openClawFirstMessage =
	"Find me a concert in Berlin and book 2 tickets if there are seats together.";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const setupSteps = [
	{
		title: "Verify your identity",
		description:
			"Present your PID credential so VidoShow can confirm who you are before issuing delegation authority.",
		to: "/identity",
		icon: Fingerprint,
		gradient: "from-violet-500 to-violet-700",
		shadow: "shadow-violet-500/20",
		badge: "In VidoShow",
	},
	{
		title: "Create the delegation offer",
		description:
			"Open the My Agent page and create a booking-only OID4VCI credential offer for the agent wallet.",
		to: "/agent",
		icon: KeyRound,
		gradient: "from-violet-600 to-indigo-700",
		shadow: "shadow-indigo-500/20",
		badge: "In VidoShow",
	},
	{
		title: "Let the agent redeem it",
		description:
			"Share the credential offer URL or deep link with OpenClaw. It receives the credential directly from the issuer.",
		to: "/agent",
		icon: ShieldCheck,
		gradient: "from-amber-500 to-amber-600",
		shadow: "shadow-amber-500/20",
		badge: "In OpenClaw",
	},
	{
		title: "Ask the agent to book",
		description:
			"Use natural language to search events, pick one, and let the agent complete the protected booking flow autonomously.",
		to: "/events",
		icon: Ticket,
		gradient: "from-emerald-500 to-emerald-600",
		shadow: "shadow-emerald-500/20",
		badge: "In OpenClaw",
	},
] as const;

const appPages = [
	{
		label: "Identity",
		to: "/identity",
		description:
			"Verify the user with PID before any delegation credential can be issued.",
		icon: Fingerprint,
	},
	{
		label: "My Agent",
		to: "/agent",
		description:
			"Generate the OID4VCI credential offer, copy the URI or deep link, and watch onboarding status.",
		icon: KeyRound,
	},
	{
		label: "Events",
		to: "/events",
		description:
			"Browse the event catalog. Once delegated, the agent can search and book from here.",
		icon: Ticket,
	},
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function GuidePage() {
	const isAuthenticated = useIsAuthenticated();
	const { copiedValue, copy } = useClipboard({
		onError: () => toast.error("Failed to copy to clipboard"),
	});

	const copyText = (key: string, value: string, successMessage: string) =>
		copy(value, key).then((didCopy: boolean) => {
			if (didCopy) {
				toast.success(successMessage);
			}
		});

	return (
		<div className="flex flex-col">
			{/* ── Hero ──────────────────────────────────────────────────── */}
			<section className="relative overflow-hidden">
				{/* Background atmosphere */}
				<div className="absolute inset-0 -z-10">
					<div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-background to-amber-50/30" />
					<div className="absolute top-[-25%] left-[-8%] h-[500px] w-[500px] rounded-full bg-violet-200/25 blur-3xl" />
					<div className="absolute bottom-[-15%] right-[-5%] h-[400px] w-[400px] rounded-full bg-amber-200/20 blur-3xl" />
					<div
						className="absolute inset-0 opacity-[0.025]"
						style={{
							backgroundImage:
								"linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
							backgroundSize: "48px 48px",
						}}
					/>
				</div>

				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
					<div className="max-w-3xl animate-slide-up">
						<div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 backdrop-blur-sm mb-8">
							<Sparkles className="h-3.5 w-3.5 text-primary" />
							<span className="text-xs font-semibold tracking-wide text-primary uppercase">
								Demo Guide
							</span>
						</div>

						<h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.1] mb-6">
							Set up{" "}
							<span className="relative inline-block">
								<span className="relative z-10 bg-gradient-to-r from-violet-700 via-primary to-violet-600 bg-clip-text text-transparent">
									delegated
								</span>
								<span className="absolute bottom-1 left-0 right-0 h-3 bg-gradient-to-r from-amber-300/40 to-amber-200/20 -rotate-1 rounded-sm" />
							</span>{" "}
							ticket booking
						</h1>

						<p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mb-8">
							Walk through the full VidoShow demo: verify your identity, issue a
							delegation credential, bootstrap the OpenClaw skill, and let the
							agent book event tickets autonomously.
						</p>

						<div className="flex flex-col sm:flex-row gap-3">
							<Button
								asChild
								size="lg"
								className="h-12 px-7 text-base group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-lg shadow-primary/20"
							>
								<Link to={isAuthenticated ? "/dashboard" : "/signup"}>
									{isAuthenticated ? "Continue in VidoShow" : "Start the demo"}
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								size="lg"
								className="h-12 px-6 border-primary/20 hover:bg-primary/5"
							>
								<a href="#bootstrap-openclaw">
									<Terminal className="h-4 w-4" />
									Go to bootstrap steps
								</a>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* ── Setup Steps — Connected Timeline ──────────────────────── */}
			<section className="relative py-20 lg:py-24">
				<div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-violet-50/20 to-background" />

				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mb-12">
						<p className="text-xs font-mono uppercase tracking-[0.2em] text-primary font-medium mb-3">
							The Flow
						</p>
						<h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
							Four steps to delegated booking
						</h2>
					</div>

					<div className="relative">
						{/* Vertical connector line (desktop) */}
						<div className="absolute left-[1.6rem] top-8 bottom-8 w-px bg-gradient-to-b from-violet-300/60 via-amber-300/40 to-emerald-300/60 hidden lg:block" />

						<div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-1 lg:gap-0">
							{setupSteps.map((step, index) => (
								<div
									key={step.title}
									className="group relative animate-slide-up lg:grid lg:grid-cols-[3.2rem_1fr] lg:gap-6 lg:pb-10 last:lg:pb-0"
									style={{
										animationDelay: `${index * 100}ms`,
										animationFillMode: "both",
									}}
								>
									{/* Timeline node (desktop) */}
									<div className="hidden lg:flex flex-col items-center pt-1">
										<div
											className={`relative z-10 h-[3.2rem] w-[3.2rem] rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg ${step.shadow} transition-transform duration-300 group-hover:scale-110`}
										>
											<step.icon className="h-5 w-5 text-white" />
										</div>
									</div>

									{/* Card */}
									<div className="rounded-2xl border border-border/50 bg-white/70 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
										<div className="flex items-start gap-4">
											{/* Mobile icon */}
											<div
												className={`lg:hidden h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-md ${step.shadow}`}
											>
												<step.icon className="h-5 w-5 text-white" />
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2.5 mb-2">
													<span className="text-xs font-mono text-muted-foreground/50 tracking-widest">
														0{index + 1}
													</span>
													<Badge
														variant="outline"
														className="text-[10px] px-2 py-0.5 border-primary/15 bg-primary/[0.04] text-muted-foreground font-medium"
													>
														{step.badge}
													</Badge>
												</div>
												<h3 className="font-semibold tracking-tight text-base mb-1.5">
													{step.title}
												</h3>
												<p className="text-sm text-muted-foreground leading-relaxed mb-3">
													{step.description}
												</p>
												<Link
													to={step.to}
													className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link"
												>
													Open in app
													<ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
												</Link>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ── OpenClaw Setup — Terminal-Style ───────────────────────── */}
			<section id="bootstrap-openclaw" className="py-20 lg:py-24 relative">
				<div className="absolute inset-0 -z-10">
					<div className="absolute inset-0 bg-gradient-to-t from-violet-50/30 to-transparent" />
				</div>

				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mb-12">
						<p className="text-xs font-mono uppercase tracking-[0.2em] text-primary font-medium mb-3">
							Agent Setup
						</p>
						<h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
							Bootstrap the OpenClaw 🦞 skill
						</h2>
						<p className="text-muted-foreground max-w-2xl leading-relaxed">
							Start the OpenClaw session first, let it initialize its wallet,
							then complete identity verification and delegation issuance in
							VidoShow before sharing the OID4VCI offer back to the agent.
						</p>
					</div>

					<div className="space-y-5">
						<PromptCard
							label="1. Bootstrap prompt"
							hint="Send this first so OpenClaw loads the ticket-agent skill for the current session."
							value={openClawBootstrapPrompt}
							copyKey="bootstrap"
							copiedValue={copiedValue}
							onCopy={() =>
								copyText(
									"bootstrap",
									openClawBootstrapPrompt,
									"Bootstrap prompt copied",
								)
							}
						/>

						<div className="rounded-2xl border border-border/50 bg-white/60 backdrop-blur-sm p-5 space-y-4">
							<p className="text-sm font-semibold tracking-tight">
								2. Let the agent initialize its wallet
							</p>
							<p className="text-sm text-muted-foreground leading-relaxed">
								After the bootstrap message, OpenClaw runs `openid4vc-wallet
								init` to create or reuse the demo wallet it will keep using for
								this agent session.
							</p>
						</div>

						<div className="rounded-2xl border border-border/50 bg-white/60 backdrop-blur-sm p-5 space-y-4">
							<p className="text-sm font-semibold tracking-tight">
								3. Verify your identity in VidoShow
							</p>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Go to the Identity page and present your PID credential.
								VidoShow must verify you successfully before it can issue any
								booking delegation to the agent.
							</p>
							<Link
								to="/identity"
								className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
							>
								Open Identity
								<ChevronRight className="h-3.5 w-3.5" />
							</Link>
						</div>

						<div className="rounded-2xl border border-border/50 bg-white/60 backdrop-blur-sm p-5 space-y-4">
							<p className="text-sm font-semibold tracking-tight">
								4. Create the delegated credential
							</p>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Open My Agent and generate a booking-only OID4VCI delegation
								offer for the agent wallet. This demo issues that credential
								with `@vidos-id/openid4vc-issuer`.
							</p>
							<Link
								to="/agent"
								className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
							>
								Open My Agent
								<ChevronRight className="h-3.5 w-3.5" />
							</Link>
						</div>

						<div className="rounded-2xl border border-border/50 bg-white/60 backdrop-blur-sm p-5 space-y-4">
							<p className="text-sm font-semibold tracking-tight">
								5. Share the offer with OpenClaw
							</p>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Copy the credential offer URI or deep link from My Agent and
								paste it into the same OpenClaw conversation. The agent will
								resolve the issuer metadata and redeem the delegated credential
								directly into its wallet.
							</p>
						</div>

						<PromptCard
							label="6. First booking prompt"
							hint="Use this after the wallet is ready and the delegation offer has been redeemed."
							value={openClawFirstMessage}
							copyKey="first-message"
							copiedValue={copiedValue}
							onCopy={() =>
								copyText(
									"first-message",
									openClawFirstMessage,
									"First message copied",
								)
							}
						/>
					</div>
				</div>
			</section>

			{/* ── App Pages + Why It Matters ────────────────────────────── */}
			<section className="py-20 lg:py-24 relative">
				<div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-violet-50/20 to-background" />

				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
						{/* App pages */}
						<div>
							<p className="text-xs font-mono uppercase tracking-[0.2em] text-primary font-medium mb-3">
								Inside VidoShow
							</p>
							<h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
								Use these pages in order
							</h2>

							<div className="space-y-3">
								{appPages.map((page) => (
									<Link
										key={page.label}
										to={page.to}
										className="group flex items-start gap-4 rounded-2xl border border-border/50 bg-white/60 backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5"
									>
										<div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
											<page.icon className="h-5 w-5" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<p className="font-semibold tracking-tight">
													{page.label}
												</p>
												<ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
											</div>
											<p className="text-sm text-muted-foreground leading-relaxed">
												{page.description}
											</p>
										</div>
									</Link>
								))}
							</div>
						</div>

						{/* Why it matters */}
						<div>
							<p className="text-xs font-mono uppercase tracking-[0.2em] text-primary font-medium mb-3">
								Key Insight
							</p>
							<h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
								Why this demo matters
							</h2>

							<div className="rounded-2xl border border-border/50 bg-white/60 backdrop-blur-sm p-6 space-y-5">
								<div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50/80 border border-emerald-200/50">
									<ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
									<p className="text-sm text-emerald-800 font-medium">
										The credential is only used where trust is needed: the
										protected booking action.
									</p>
								</div>

								<div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
									<p>
										The user never shares passwords or private keys with the
										agent. Instead, the agent receives a{" "}
										<span className="font-medium text-foreground">
											holder-bound delegation credential
										</span>{" "}
										with a narrow booking-only scope.
									</p>
									<p>
										That makes the purchase auditable, time-limited, and easy to
										revoke at the credential layer while keeping the interaction
										conversational.
									</p>
								</div>

								{/* Visual divider */}
								<div className="relative">
									<div className="border-t-2 border-dashed border-violet-200/50" />
									<div className="absolute -left-9 -top-2 h-4 w-4 rounded-full bg-background" />
									<div className="absolute -right-9 -top-2 h-4 w-4 rounded-full bg-background" />
								</div>

								<div className="grid grid-cols-3 gap-4 text-center">
									<div>
										<div className="h-9 w-9 mx-auto rounded-lg bg-violet-100/60 flex items-center justify-center mb-2">
											<Shield className="h-4 w-4 text-violet-600" />
										</div>
										<p className="text-xs font-semibold text-foreground/80">
											Scoped
										</p>
										<p className="text-[10px] text-muted-foreground mt-0.5">
											Booking only
										</p>
									</div>
									<div>
										<div className="h-9 w-9 mx-auto rounded-lg bg-amber-100/60 flex items-center justify-center mb-2">
											<Sparkles className="h-4 w-4 text-amber-600" />
										</div>
										<p className="text-xs font-semibold text-foreground/80">
											Autonomous
										</p>
										<p className="text-[10px] text-muted-foreground mt-0.5">
											Agent acts alone
										</p>
									</div>
									<div>
										<div className="h-9 w-9 mx-auto rounded-lg bg-emerald-100/60 flex items-center justify-center mb-2">
											<ShieldCheck className="h-4 w-4 text-emerald-600" />
										</div>
										<p className="text-xs font-semibold text-foreground/80">
											Revocable
										</p>
										<p className="text-[10px] text-muted-foreground mt-0.5">
											Credential layer
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── Footer CTA ───────────────────────────────────────────── */}
			<section className="pb-20 lg:pb-28">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-transparent to-amber-500/[0.03] p-8 sm:p-10 text-center">
						<p className="text-xs font-mono uppercase tracking-[0.2em] text-primary font-medium mb-3">
							Ready?
						</p>
						<h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
							Try it end to end
						</h2>
						<p className="text-muted-foreground max-w-lg mx-auto leading-relaxed mb-6">
							Sign up, verify your identity, issue the delegation credential,
							and let the agent book tickets for you.
						</p>
						<Button
							asChild
							size="lg"
							className="h-12 px-8 text-base group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-lg shadow-primary/20"
						>
							<Link to={isAuthenticated ? "/dashboard" : "/signup"}>
								{isAuthenticated ? "Go to Dashboard" : "Start the demo"}
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Prompt Card                                                        */
/* ------------------------------------------------------------------ */

function PromptCard({
	label,
	hint,
	value,
	copyKey,
	copiedValue,
	onCopy,
}: {
	label: string;
	hint: string;
	value: string;
	copyKey: string;
	copiedValue: string | null;
	onCopy: () => void;
}) {
	const isCopied = copiedValue === copyKey;

	return (
		<div className="rounded-2xl border border-border/50 bg-white/60 backdrop-blur-sm overflow-hidden">
			{/* Header bar */}
			<div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/40 bg-muted/20">
				<div className="flex items-center gap-2.5">
					<Terminal className="h-3.5 w-3.5 text-primary/60" />
					<span className="text-sm font-semibold tracking-tight">{label}</span>
				</div>
				<button
					type="button"
					onClick={onCopy}
					className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
						isCopied
							? "bg-emerald-100 text-emerald-700 border border-emerald-200/60"
							: "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/15"
					}`}
				>
					{isCopied ? (
						<Check className="h-3 w-3" />
					) : (
						<Copy className="h-3 w-3" />
					)}
					{isCopied ? "Copied" : "Copy"}
				</button>
			</div>

			{/* Content */}
			<div className="px-5 py-4 space-y-2.5">
				<p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
				<div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
					<pre className="font-mono text-xs text-gray-100 leading-relaxed whitespace-pre-wrap break-all select-all">
						{value}
					</pre>
				</div>
			</div>
		</div>
	);
}
