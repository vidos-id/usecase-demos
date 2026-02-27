import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	CalendarCheck,
	Car,
	CheckCircle2,
	Code2,
	FileSearch,
	FileX,
	Globe,
	IdCard,
	QrCode,
	RefreshCw,
	ShieldCheck,
	Wallet,
	Zap,
} from "lucide-react";
import { Footer } from "@/components/homepage/footer";
import { Header } from "@/components/homepage/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/how-it-works")({
	component: HowItWorksPage,
});

// ─── Constants ─────────────────────────────────────────────────────────────────

const blueAccent = "var(--primary)";
const purpleAccent = "var(--primary)";

// ─── Journey steps ─────────────────────────────────────────────────────────────

interface JourneyStep {
	number: number;
	icon: React.ReactNode;
	title: string;
	description: string;
}

const journeySteps: JourneyStep[] = [
	{
		number: 1,
		icon: <CalendarCheck className="size-6" />,
		title: "Book online",
		description: "Choose a car. No account, no forms, no friction.",
	},
	{
		number: 2,
		icon: <IdCard className="size-6" />,
		title: "Identity check requested",
		description: "We ask for a digital licence and ID — nothing more.",
	},
	{
		number: 3,
		icon: <QrCode className="size-6" />,
		title: "Scan & share",
		description: "Customer scans a QR code with their EU Digital Wallet.",
	},
	{
		number: 4,
		icon: <ShieldCheck className="size-6" />,
		title: "Instant verification",
		description: "Credentials are validated cryptographically in milliseconds.",
	},
	{
		number: 5,
		icon: <Car className="size-6" />,
		title: "Pickup confirmed",
		description: "Agent confirms the booking attestation at the counter.",
	},
	{
		number: 6,
		icon: <CheckCircle2 className="size-6" />,
		title: "Keys handed over",
		description: "Zero paper. Zero queues. Fully compliant.",
	},
];

// ─── Business pillars ──────────────────────────────────────────────────────────

interface Pillar {
	icon: React.ReactNode;
	headline: string;
	sub: string;
}

const pillars: Pillar[] = [
	{
		icon: <FileX className="size-7" />,
		headline: "No paper. No queues.",
		sub: "Customers prove identity in seconds — no forms, no photocopies, no manual checks.",
	},
	{
		icon: <Zap className="size-7" />,
		headline: "Instant verification.",
		sub: "Every credential is validated cryptographically in real time, with zero human error.",
	},
	{
		icon: <Globe className="size-7" />,
		headline: "EU-compliant identity.",
		sub: "Built on the EUDI Wallet standard (eIDAS 2.0). Trusted across all EU member states.",
	},
];

// ─── API integration steps ─────────────────────────────────────────────────────

interface ApiStep {
	number: number;
	icon: React.ReactNode;
	title: string;
	description: string;
	detail?: React.ReactNode;
}

function EndpointBlock({
	method,
	path,
	returns,
}: {
	method: "GET" | "POST";
	path: string;
	returns?: string;
}) {
	const methodColor =
		method === "POST" ? "oklch(0.42 0.1 220)" : "oklch(0.55 0.16 145)";

	return (
		<div className="mt-3 overflow-hidden rounded-lg border border-border/50 bg-muted/30 font-mono text-xs">
			<div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
				<span
					className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider"
					style={{ background: `${methodColor}20`, color: methodColor }}
				>
					{method}
				</span>
				<span className="text-foreground/80">{path}</span>
			</div>
			{returns && (
				<div className="px-3 py-2 text-muted-foreground">
					<span className="text-muted-foreground/60">→ </span>
					{returns}
				</div>
			)}
		</div>
	);
}

function ClaimsBadgeRow() {
	const claims = [
		"given_name",
		"family_name",
		"birth_date",
		"document_number",
		"expiry_date",
		"portrait",
	];
	return (
		<div className="mt-3 flex flex-wrap gap-1.5">
			{claims.map((claim) => (
				<span
					key={claim}
					className="rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
				>
					{claim}
				</span>
			))}
		</div>
	);
}

function StatusBadgeRow() {
	const statuses = [
		{ label: "pending_wallet", color: "oklch(0.65 0.15 60)" },
		{ label: "authorized", color: "oklch(0.52 0.16 145)" },
		{ label: "rejected", color: "oklch(0.55 0.18 25)" },
		{ label: "expired", color: "oklch(0.55 0.1 280)" },
		{ label: "error", color: "oklch(0.5 0.1 0)" },
	] as const;

	return (
		<div className="mt-3 flex flex-wrap gap-1.5">
			{statuses.map(({ label, color }) => (
				<span
					key={label}
					className="rounded-md border px-2 py-0.5 font-mono text-[11px]"
					style={{
						borderColor: `${color}40`,
						background: `${color}12`,
						color,
					}}
				>
					{label}
				</span>
			))}
		</div>
	);
}

const apiSteps: ApiStep[] = [
	{
		number: 1,
		icon: <Code2 className="size-4" />,
		title: "Create a credential request (DCQL)",
		description:
			"The app calls the Vidos Authorizer API using openapi-fetch with generated types from openapi-typescript. The credential request is described using DCQL (DIF Credential Query Language), specifying the required mDL claims and doctype.",
		detail: (
			<>
				<p className="mt-2 text-xs text-muted-foreground">
					Namespace:{" "}
					<code className="rounded bg-muted/50 px-1 font-mono text-[11px]">
						org.iso.18013.5.1
					</code>{" "}
					· Doctype:{" "}
					<code className="rounded bg-muted/50 px-1 font-mono text-[11px]">
						org.iso.18013.5.1.mDL
					</code>
				</p>
				<p className="mt-1.5 text-xs text-muted-foreground">
					Requested claims:
				</p>
				<ClaimsBadgeRow />
				<EndpointBlock
					method="POST"
					path="/openid4/vp/v1_0/authorizations"
					returns="authorizationId · authorizeUrl · nonce · expiresAt"
				/>
			</>
		),
	},
	{
		number: 2,
		icon: <QrCode className="size-4" />,
		title: "QR code & wallet handoff",
		description:
			"The authorizeUrl returned in step 1 is rendered as a QR code. The user scans it with their EUDI Wallet, which opens the credential presentation flow — the wallet prompts the user to consent to sharing the requested claims.",
		detail: null,
	},
	{
		number: 3,
		icon: <RefreshCw className="size-4" />,
		title: "Status polling",
		description:
			"The app polls the status endpoint every second until the wallet responds. Polling stops as soon as a terminal state is reached.",
		detail: (
			<>
				<EndpointBlock
					method="GET"
					path="/openid4/vp/v1_0/authorizations/{authorizationId}/status"
				/>
				<p className="mt-2 text-xs text-muted-foreground">Possible states:</p>
				<StatusBadgeRow />
			</>
		),
	},
	{
		number: 4,
		icon: <FileSearch className="size-4" />,
		title: "Retrieve policy & credentials",
		description:
			"Once authorized, the app fetches the policy response — containing validity, integrity, and trusted-issuer checks — and the disclosed credential claims the user consented to share.",
		detail: (
			<>
				<EndpointBlock
					method="GET"
					path="/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response"
					returns="overallStatus · checks[]"
				/>
				<EndpointBlock
					method="GET"
					path="/openid4/vp/v1_0/authorizations/{authorizationId}/credentials"
					returns="disclosed credential claims"
				/>
			</>
		),
	},
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function JourneyCard({ step }: { step: JourneyStep }) {
	return (
		<div
			className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-md"
			style={{
				borderTopColor: `${blueAccent}30`,
			}}
		>
			{/* Large ghost step number */}
			<div
				className="pointer-events-none absolute -right-2 -top-3 select-none font-heading text-8xl font-black leading-none opacity-[0.045]"
				style={{ color: blueAccent }}
				aria-hidden="true"
			>
				{step.number}
			</div>

			{/* Icon */}
			<div
				className="mb-4 flex size-12 items-center justify-center rounded-xl"
				style={{
					background: `${blueAccent}12`,
					border: `1px solid ${blueAccent}28`,
					color: blueAccent,
				}}
			>
				{step.icon}
			</div>

			{/* Step label */}
			<p
				className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-widest"
				style={{ color: blueAccent }}
			>
				Step {step.number}
			</p>

			<h3 className="font-heading mb-2 text-base font-bold tracking-tight">
				{step.title}
			</h3>
			<p className="text-sm leading-relaxed text-muted-foreground">
				{step.description}
			</p>
		</div>
	);
}

function PillarCard({ pillar }: { pillar: Pillar }) {
	return (
		<div
			className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card px-8 py-7"
			style={{
				borderTopWidth: "3px",
				borderTopColor: blueAccent,
			}}
		>
			<div
				className="flex size-12 items-center justify-center rounded-xl"
				style={{ background: `${blueAccent}10`, color: blueAccent }}
			>
				{pillar.icon}
			</div>
			<div>
				<p className="font-heading mb-1.5 text-xl font-extrabold tracking-tight">
					{pillar.headline}
				</p>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{pillar.sub}
				</p>
			</div>
		</div>
	);
}

function ApiStepCard({ step }: { step: ApiStep }) {
	return (
		<div className="flex gap-4">
			{/* Number bubble */}
			<div className="flex flex-col items-center">
				<div
					className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
					style={{ background: purpleAccent }}
				>
					{step.number}
				</div>
				{step.number < apiSteps.length && (
					<div
						className="mt-1 w-px flex-1"
						style={{
							background: `linear-gradient(to bottom, ${purpleAccent}30, transparent)`,
							minHeight: "1.5rem",
						}}
					/>
				)}
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1 pb-5">
				<div className="mb-1 flex items-center gap-2">
					<span style={{ color: purpleAccent }}>{step.icon}</span>
					<h4 className="font-heading text-sm font-bold">{step.title}</h4>
				</div>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{step.description}
				</p>
				{step.detail}
			</div>
		</div>
	);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function HowItWorksPage() {
	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main>
				{/* ── 1. Hero ───────────────────────────────────────────────────── */}
				<section className="relative overflow-hidden border-b border-border/50 pb-20 pt-16">
					{/* Ambient glow */}
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${blueAccent}09 0%, transparent 65%)`,
						}}
					/>

					<div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
						<Badge
							variant="secondary"
							className="mb-5 font-mono text-[11px] uppercase tracking-widest"
						>
							<Wallet className="mr-1.5 size-3" />
							EU Digital Identity · Car Rental
						</Badge>

						<h1 className="font-heading mb-5 text-5xl font-extrabold tracking-tight sm:text-6xl">
							Rent a car.
							<br />
							<span
								className="text-gradient"
								style={{
									backgroundImage: `linear-gradient(135deg, ${blueAccent}, oklch(0.55 0.18 200))`,
								}}
							>
								No paperwork.
							</span>
						</h1>

						<p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
							Customers prove identity in seconds using their EU Digital Wallet.
							Every verification is cryptographically signed, instantly
							auditable, and fully EU-compliant.
						</p>
					</div>
				</section>

				{/* ── 2. The experience ─────────────────────────────────────────── */}
				<section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
					<div className="mb-12 text-center">
						<p
							className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest"
							style={{ color: blueAccent }}
						>
							The experience
						</p>
						<h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
							Six steps. Under two minutes.
						</h2>
						<p className="mt-3 text-base text-muted-foreground">
							From booking to driving away — entirely digital.
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{journeySteps.map((step) => (
							<JourneyCard key={step.number} step={step} />
						))}
					</div>
				</section>

				{/* ── 3. Why it matters ─────────────────────────────────────────── */}
				<section
					className="border-y border-border/50 py-20"
					style={{
						background: `linear-gradient(to bottom, ${blueAccent}05, transparent)`,
					}}
				>
					<div className="mx-auto max-w-6xl px-4 sm:px-6">
						<div className="mb-12 text-center">
							<p
								className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest"
								style={{ color: blueAccent }}
							>
								Why it matters
							</p>
							<h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
								Built for the modern fleet operator.
							</h2>
						</div>

						<div className="grid gap-5 sm:grid-cols-3">
							{pillars.map((pillar) => (
								<PillarCard key={pillar.headline} pillar={pillar} />
							))}
						</div>
					</div>
				</section>

				{/* ── 4. For developers (API) ───────────────────────────────────── */}
				<section
					className="border-b border-border/50 py-16"
					style={{ background: "var(--surface)" }}
				>
					<div className="mx-auto max-w-5xl px-4 sm:px-6">
						{/* Section header */}
						<div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<div className="mb-3">
									<span
										className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest"
										style={{
											borderColor: `${purpleAccent}35`,
											color: purpleAccent,
											background: `${purpleAccent}08`,
										}}
									>
										<Code2 className="size-3" />
										For developers
									</span>
								</div>
								<h2 className="font-heading text-xl font-bold tracking-tight">
									Vidos Authorizer API integration
								</h2>
								<p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
									Uses{" "}
									<code className="rounded bg-muted/70 px-1 font-mono text-[11px]">
										openapi-fetch
									</code>{" "}
									with types generated by{" "}
									<code className="rounded bg-muted/70 px-1 font-mono text-[11px]">
										openapi-typescript
									</code>{" "}
									against the{" "}
									<a
										href="https://vidos.id/products/vidos-authorizer"
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium hover:underline"
										style={{ color: purpleAccent }}
									>
										Vidos Authorizer
									</a>{" "}
									OpenAPI spec.
								</p>
							</div>

							<a
								href="https://vidos.id/docs"
								target="_blank"
								rel="noopener noreferrer"
								className="shrink-0 text-sm font-medium hover:underline"
								style={{ color: purpleAccent }}
							>
								API docs →
							</a>
						</div>

						{/* API steps */}
						<Card className="border-border/60 bg-card/80">
							<CardContent className="p-6">
								<div>
									{apiSteps.map((step) => (
										<ApiStepCard key={step.number} step={step} />
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* ── 5. CTA ────────────────────────────────────────────────────── */}
				<section className="py-20">
					<div className="mx-auto max-w-xl px-4 text-center sm:px-6">
						<Separator className="mb-16 opacity-40" />

						<p
							className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest"
							style={{ color: blueAccent }}
						>
							Ready to see it?
						</p>
						<h2 className="font-heading mb-4 text-3xl font-extrabold tracking-tight">
							Try the demo.
						</h2>
						<p className="mb-8 text-base text-muted-foreground">
							Book a car and verify your identity with the EU Digital Wallet —
							end to end, in under two minutes.
						</p>

						<Button
							asChild
							size="lg"
							className="rounded-xl px-8 text-base font-semibold"
						>
							<Link to="/">
								Start the demo
								<ArrowRight className="ml-2 size-4" />
							</Link>
						</Button>
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}
