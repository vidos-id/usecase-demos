import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Bot,
	CheckCircle2,
	FileCheck2,
	Fingerprint,
	KeyRound,
	Shield,
	ShieldCheck,
	Sparkles,
	Ticket,
	UserCheck,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/_app/")({
	component: LandingPage,
});

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */

function LandingPage() {
	const isAuthenticated = useIsAuthenticated();

	return (
		<div className="flex flex-col">
			<HeroSection isAuthenticated={isAuthenticated} />
			<HowItWorksSection />
			<WhatThisDemonstratesSection />
			<Footer />
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
	return (
		<section className="relative overflow-hidden">
			{/* Background — layered gradient mesh */}
			<div className="absolute inset-0 -z-10">
				{/* Base gradient */}
				<div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-background to-amber-50/40" />
				{/* Large glow orbs */}
				<div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-200/30 blur-3xl" />
				<div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-amber-200/20 blur-3xl" />
				<div className="absolute top-[30%] right-[20%] h-[300px] w-[300px] rounded-full bg-violet-300/15 blur-2xl" />
				{/* Subtle grid overlay */}
				<div
					className="absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage:
							"linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
						backgroundSize: "64px 64px",
					}}
				/>
			</div>

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-36">
				<div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
					{/* Left — Copy */}
					<div className="space-y-8 animate-slide-up">
						{/* Badge */}
						<div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 backdrop-blur-sm">
							<Sparkles className="h-3.5 w-3.5 text-primary" />
							<span className="text-xs font-semibold tracking-wide text-primary uppercase">
								VidoShow - AI Agent Delegation Demo
							</span>
						</div>

						{/* Headline */}
						<div className="space-y-5">
							<h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08]">
								Event Tickets with{" "}
								<span className="relative inline-block">
									<span className="relative z-10 bg-gradient-to-r from-violet-700 via-primary to-violet-600 bg-clip-text text-transparent">
										AI Agent
									</span>
									<span className="absolute bottom-1 left-0 right-0 h-3 bg-gradient-to-r from-amber-300/40 to-amber-200/20 -rotate-1 rounded-sm" />
								</span>{" "}
								Delegation
							</h1>
							<p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
								VidoShow lets you delegate your AI agent to purchase event
								tickets on your behalf. Your identity stays in your wallet -
								your agent acts with verifiable, scoped authority.
							</p>
						</div>

						{/* CTAs */}
						<div className="flex flex-col sm:flex-row gap-3 pt-2">
							{isAuthenticated ? (
								<Button
									asChild
									size="lg"
									className="text-base px-7 h-12 group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-lg shadow-primary/20"
								>
									<Link to="/dashboard">
										Go to Dashboard
										<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
									</Link>
								</Button>
							) : (
								<>
									<Button
										asChild
										size="lg"
										className="text-base px-7 h-12 group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-lg shadow-primary/20"
									>
										<Link to="/signup">
											Sign Up
											<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
										</Link>
									</Button>
									<Button
										asChild
										variant="outline"
										size="lg"
										className="text-base px-7 h-12 border-primary/20 hover:bg-primary/5"
									>
										<Link to="/signin">Sign In</Link>
									</Button>
								</>
							)}
						</div>

						{/* Trust indicators */}
						<div className="flex items-center gap-6 pt-2">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<ShieldCheck className="h-4 w-4 text-primary/60" />
								<span>Verifiable Credentials</span>
							</div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<KeyRound className="h-4 w-4 text-primary/60" />
								<span>Delegated Authority</span>
							</div>
						</div>
					</div>

					{/* Right — Visual */}
					<div
						className="relative hidden lg:flex items-center justify-center animate-fade-in"
						style={{ animationDelay: "200ms", animationFillMode: "both" }}
					>
						<HeroVisual />
					</div>
				</div>
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/*  Hero Visual — Floating ticket card with credential badge           */
/* ------------------------------------------------------------------ */

function HeroVisual() {
	return (
		<div className="relative w-full max-w-sm">
			{/* Glow behind the card */}
			<div className="absolute inset-0 translate-y-4 bg-gradient-to-br from-violet-400/20 to-amber-300/15 rounded-3xl blur-2xl scale-95" />

			{/* Main ticket card */}
			<div className="relative bg-white/80 backdrop-blur-xl border border-violet-200/50 rounded-2xl shadow-2xl shadow-violet-900/5 p-6 space-y-5 animate-float">
				{/* Event header */}
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
							Live Event
						</p>
						<h3 className="text-lg font-bold tracking-tight">
							Synthwave Nights
						</h3>
						<p className="text-sm text-muted-foreground">
							June 15, 2026 &middot; Berlin
						</p>
					</div>
					<div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shadow-violet-500/20">
						<Ticket className="h-5 w-5 text-white" />
					</div>
				</div>

				{/* Divider — dashed ticket tear */}
				<div className="relative">
					<div className="border-t-2 border-dashed border-violet-200/60" />
					<div className="absolute -left-9 -top-2.5 h-5 w-5 rounded-full bg-background" />
					<div className="absolute -right-9 -top-2.5 h-5 w-5 rounded-full bg-background" />
				</div>

				{/* Ticket details */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
							Section
						</p>
						<p className="text-sm font-semibold">VIP-A &middot; Row 3</p>
					</div>
					<div className="space-y-1">
						<p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
							Seat
						</p>
						<p className="text-sm font-semibold">14</p>
					</div>
					<div className="space-y-1">
						<p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
							Purchased By
						</p>
						<div className="flex items-center gap-1.5">
							<Bot className="h-3.5 w-3.5 text-violet-500" />
							<p className="text-sm font-semibold text-violet-700">AI Agent</p>
						</div>
					</div>
					<div className="space-y-1">
						<p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
							Price
						</p>
						<p className="text-sm font-semibold">€89.00</p>
					</div>
				</div>

				{/* Verified badge */}
				<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/50">
					<CheckCircle2 className="h-4 w-4 text-emerald-600" />
					<span className="text-xs font-medium text-emerald-700">
						Delegation credential verified
					</span>
				</div>
			</div>

			{/* Floating credential badge */}
			<div
				className="absolute -bottom-4 -left-6 bg-white/90 backdrop-blur-lg border border-amber-200/60 rounded-xl shadow-lg shadow-amber-900/5 px-4 py-3 flex items-center gap-3 animate-slide-up"
				style={{ animationDelay: "400ms", animationFillMode: "both" }}
			>
				<div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
					<Shield className="h-4 w-4 text-white" />
				</div>
				<div>
					<p className="text-xs font-semibold">Delegation VC</p>
					<p className="text-[10px] text-muted-foreground">
						Scoped &middot; Time-limited
					</p>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */

const steps = [
	{
		number: "01",
		title: "Verify Your Identity",
		description:
			"Present your PID (Person Identification Data) credential to confirm who you are.",
		icon: Fingerprint,
		gradient: "from-violet-500 to-violet-700",
		shadow: "shadow-violet-500/20",
	},
	{
		number: "02",
		title: "Onboard Your Agent",
		description:
			"Paste your AI agent's public key and select which permissions to grant.",
		icon: Bot,
		gradient: "from-violet-600 to-indigo-700",
		shadow: "shadow-indigo-500/20",
	},
	{
		number: "03",
		title: "Issue Delegation Credential",
		description:
			"Receive a verifiable credential granting your agent scoped authority to act.",
		icon: FileCheck2,
		gradient: "from-amber-500 to-amber-600",
		shadow: "shadow-amber-500/20",
	},
	{
		number: "04",
		title: "Agent Books Tickets",
		description:
			"Your agent autonomously purchases event tickets, presenting the credential for verification.",
		icon: Ticket,
		gradient: "from-emerald-500 to-emerald-600",
		shadow: "shadow-emerald-500/20",
	},
] as const;

function HowItWorksSection() {
	return (
		<section className="relative py-24 lg:py-32">
			{/* Subtle background */}
			<div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-violet-50/30 to-background" />

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section header */}
				<div className="text-center space-y-4 mb-16">
					<p className="text-xs font-mono uppercase tracking-[0.2em] text-primary font-medium">
						How It Works
					</p>
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
						Four steps to delegated ticketing
					</h2>
					<p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
						From identity verification to autonomous ticket purchases — a
						complete delegation flow.
					</p>
				</div>

				{/* Steps grid */}
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
					{steps.map((step, i) => (
						<div
							key={step.number}
							className="group relative animate-slide-up"
							style={{
								animationDelay: `${i * 100}ms`,
								animationFillMode: "both",
							}}
						>
							{/* Connector line (between cards, desktop only) */}
							{i < steps.length - 1 && (
								<div className="hidden lg:block absolute top-10 -right-3 w-6 border-t-2 border-dashed border-violet-200/60 z-10" />
							)}

							<Card className="relative h-full border-border/60 bg-white/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden">
								<CardContent className="p-6 space-y-4">
									{/* Step number + icon */}
									<div className="flex items-center justify-between">
										<span className="text-xs font-mono text-muted-foreground/60 tracking-widest">
											{step.number}
										</span>
										<div
											className={`h-10 w-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-md ${step.shadow} transition-transform duration-300 group-hover:scale-110`}
										>
											<step.icon className="h-5 w-5 text-white" />
										</div>
									</div>

									{/* Text */}
									<div className="space-y-2">
										<h3 className="font-semibold tracking-tight text-[0.95rem]">
											{step.title}
										</h3>
										<p className="text-sm text-muted-foreground leading-relaxed">
											{step.description}
										</p>
									</div>
								</CardContent>
							</Card>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/*  What This Demonstrates                                             */
/* ------------------------------------------------------------------ */

const concepts = [
	{
		icon: FileCheck2,
		title: "Credential Issuance",
		description:
			"The platform issues W3C-standard verifiable credentials that cryptographically attest to delegated permissions.",
		color: "text-violet-600",
		bg: "bg-violet-100/60",
	},
	{
		icon: KeyRound,
		title: "Delegated Authority",
		description:
			"Users grant their AI agents specific, scoped permissions — without sharing private keys or passwords.",
		color: "text-indigo-600",
		bg: "bg-indigo-100/60",
	},
	{
		icon: Bot,
		title: "Agent Autonomy",
		description:
			"The AI agent independently completes purchases by presenting its delegation credential to the ticket vendor.",
		color: "text-amber-600",
		bg: "bg-amber-100/60",
	},
	{
		icon: ShieldCheck,
		title: "Standard Verification",
		description:
			"Any relying party can verify the credential's authenticity using open standards — no vendor lock-in.",
		color: "text-emerald-600",
		bg: "bg-emerald-100/60",
	},
] as const;

function WhatThisDemonstratesSection() {
	return (
		<section className="py-24 lg:py-32 relative">
			<div className="absolute inset-0 -z-10">
				<div className="absolute inset-0 bg-gradient-to-t from-violet-50/40 to-transparent" />
			</div>

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section header */}
				<div className="text-center space-y-4 mb-16">
					<p className="text-xs font-mono uppercase tracking-[0.2em] text-primary font-medium">
						Key Concepts
					</p>
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
						What this demonstrates
					</h2>
					<p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
						Core building blocks of trustworthy AI agent delegation using
						verifiable credentials.
					</p>
				</div>

				{/* Concept cards */}
				<div className="grid sm:grid-cols-2 gap-6">
					{concepts.map((concept, i) => (
						<Card
							key={concept.title}
							className="group border-border/60 bg-white/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-slide-up"
							style={{
								animationDelay: `${i * 80}ms`,
								animationFillMode: "both",
							}}
						>
							<CardContent className="p-7 flex gap-5">
								<div
									className={`h-12 w-12 shrink-0 rounded-xl ${concept.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
								>
									<concept.icon className={`h-6 w-6 ${concept.color}`} />
								</div>
								<div className="space-y-2">
									<h3 className="font-semibold tracking-tight">
										{concept.title}
									</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">
										{concept.description}
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer() {
	return (
		<footer className="border-t border-border/40 py-10">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-2.5 text-sm text-muted-foreground">
						<div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
							<Shield className="h-4 w-4 text-primary" />
						</div>
						<span className="font-medium">Powered by Vidos</span>
					</div>
					<div className="flex items-center gap-5 text-xs text-muted-foreground/60">
						<div className="flex items-center gap-1.5">
							<UserCheck className="h-3.5 w-3.5" />
							<span>Verifiable Credentials</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Zap className="h-3.5 w-3.5" />
							<span>Agent Delegation</span>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
