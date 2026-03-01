import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	CheckCircle2,
	Code2,
	CreditCard,
	FileSearch,
	MapPin,
	Package,
	QrCode,
	RefreshCw,
	ShieldCheck,
	ShoppingCart,
	Smartphone,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/how-it-works")({
	component: HowItWorksPage,
});

const wineAccent = "var(--primary)";

// ─── Journey steps ──────────────────────────────────────────────────────────────

const steps = [
	{
		icon: ShoppingCart,
		title: "Browse & Add to Cart",
		desc: "Explore our curated selection of wines from Europe's finest estates. Add bottles to your cart with a single click.",
		num: "01",
	},
	{
		icon: MapPin,
		title: "Select Destination",
		desc: "Choose your shipping destination — London, UK (18+) or New York, USA (21+). Legal drinking age requirements differ by region.",
		num: "02",
	},
	{
		icon: Smartphone,
		title: "Verify Your Identity",
		desc: "Scan a QR code with your EU Digital Identity Wallet. Your wallet presents your PID (Personal ID) credential securely — no forms, no uploads.",
		num: "03",
	},
	{
		icon: ShieldCheck,
		title: "Age Check",
		desc: "Our system verifies your disclosed age against the destination's legal drinking age. The requested PID claim depends on your selected method: age_equal_or_over, age_in_years, or birthdate.",
		num: "04",
	},
	{
		icon: CreditCard,
		title: "Simulated Payment",
		desc: "Complete a simulated payment to demonstrate the end-to-end flow. No real transaction occurs — this is a demo use case.",
		num: "05",
	},
	{
		icon: Package,
		title: "Order Confirmed",
		desc: "Your order confirmation shows verified credential highlights including your name, age, and identity badge from your digital wallet.",
		num: "06",
	},
];

// ─── API section components ─────────────────────────────────────────────────────

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
		'["age_equal_or_over", "<minimumAge>"]',
		'["age_in_years"]',
		'["birthdate"]',
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

// ─── API steps ──────────────────────────────────────────────────────────────────

interface ApiStep {
	number: number;
	icon: React.ReactNode;
	title: string;
	description: string;
	detail?: React.ReactNode;
}

const apiSteps: ApiStep[] = [
	{
		number: 1,
		icon: <Code2 className="size-4" />,
		title: "Create a credential request (DCQL)",
		description:
			"The app calls the Vidos Authorizer API using openapi-fetch with generated types from openapi-typescript. The credential request uses DCQL (DIF Credential Query Language), specifying PID in SD-JWT format with one selected claim path: age_equal_or_over, age_in_years, or birthdate.",
		detail: (
			<>
				<p className="mt-2 text-xs text-muted-foreground">
					Format:{" "}
					<code className="rounded bg-muted/50 px-1 font-mono text-[11px]">
						dc+sd-jwt
					</code>{" "}
					· VCT:{" "}
					<code className="rounded bg-muted/50 px-1 font-mono text-[11px]">
						urn:eudi:pid:1
					</code>
				</p>
				<p className="mt-1.5 text-xs text-muted-foreground">
					Requested claims:
				</p>
				<ClaimsBadgeRow />
				<p className="mt-2 text-xs text-muted-foreground">
					The claim path is{" "}
					<code className="rounded bg-muted/50 px-1 font-mono text-[11px]">
						["age_equal_or_over", "{`{minimumAge}`}"] | ["age_in_years"] |
						["birthdate"]
					</code>{" "}
					— selected by user preference, with minimumAge = 18 or 21 based on the
					shipping destination.
				</p>
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
			"The authorizeUrl returned in step 1 is rendered as a QR code. The user scans it with their EUDI Wallet, which opens the credential presentation flow — the wallet prompts the user to consent to sharing the requested age attribute.",
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
					returns="disclosed credential claims (selected age method claim)"
				/>
			</>
		),
	},
];

function ApiStepCard({ step }: { step: ApiStep }) {
	return (
		<div className="flex gap-4">
			<div className="flex flex-col items-center">
				<div
					className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
					style={{ background: wineAccent, color: "var(--primary-foreground)" }}
				>
					{step.number}
				</div>
				{step.number < apiSteps.length && (
					<div
						className="mt-1 w-px flex-1"
						style={{
							background: `linear-gradient(to bottom, ${wineAccent}30, transparent)`,
							minHeight: "1.5rem",
						}}
					/>
				)}
			</div>

			<div className="min-w-0 flex-1 pb-5">
				<div className="mb-1 flex items-center gap-2">
					<span style={{ color: wineAccent }}>{step.icon}</span>
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

// ─── Page ─────────────────────────────────────────────────────────────────────────

function HowItWorksPage() {
	return (
		<div className="min-h-screen bg-background">
			<Header>
				<Link
					to="/"
					className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
				>
					← Back to shop
				</Link>
			</Header>

			<main>
				{/* ── Hero ─────────────────────────────────────────────────── */}
				<section className="relative overflow-hidden border-b border-border/50 pb-20 pt-16">
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${wineAccent}09 0%, transparent 65%)`,
						}}
					/>

					<div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
						<div
							className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl"
							style={{ background: "oklch(0.4 0.12 15 / 0.1)" }}
						>
							<ShieldCheck
								className="size-8"
								style={{ color: "var(--primary)" }}
							/>
						</div>
						<h1 className="font-heading mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
							How It Works
						</h1>
						<p className="mx-auto max-w-lg text-base text-muted-foreground">
							This demo showcases age-verified wine delivery using the{" "}
							<strong className="text-foreground">
								EU Digital Identity Wallet
							</strong>{" "}
							and PID credentials — the future of privacy-preserving identity
							verification.
						</p>
					</div>
				</section>

				{/* ── Journey steps ────────────────────────────────────────── */}
				<section className="border-b border-border/50 py-16">
					<div className="mx-auto max-w-4xl px-4 sm:px-6">
						<h2 className="font-heading mb-8 text-xl font-bold tracking-tight">
							The customer journey
						</h2>
						<div className="space-y-4">
							{steps.map((step, i) => (
								<Card
									key={step.num}
									className="border-border/60 transition-all duration-200 hover:shadow-md"
								>
									<CardContent className="flex gap-5 p-5">
										<div className="shrink-0">
											<div
												className="flex size-12 items-center justify-center rounded-xl"
												style={{ background: "oklch(0.4 0.12 15 / 0.08)" }}
											>
												<step.icon
													className="size-5"
													style={{ color: "var(--primary)" }}
												/>
											</div>
										</div>
										<div className="min-w-0 flex-1">
											<div className="mb-1 flex items-center gap-2">
												<span
													className="text-xs font-bold"
													style={{ color: "var(--gold)" }}
												>
													{step.num}
												</span>
												<h3 className="font-heading text-base font-bold">
													{step.title}
												</h3>
											</div>
											<p className="text-sm leading-relaxed text-muted-foreground">
												{step.desc}
											</p>
										</div>
										{i < steps.length - 1 && (
											<ArrowRight className="mt-3 hidden size-4 shrink-0 text-muted-foreground/30 sm:block" />
										)}
										{i === steps.length - 1 && (
											<CheckCircle2
												className="mt-3 hidden size-4 shrink-0 sm:block"
												style={{ color: "oklch(0.52 0.16 145)" }}
											/>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</section>

				{/* ── Vidos Authorizer API integration ─────────────────────── */}
				<section
					className="border-b border-border/50 py-16"
					style={{ background: "var(--surface)" }}
				>
					<div className="mx-auto max-w-4xl px-4 sm:px-6">
						<div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<div className="mb-3">
									<span
										className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest"
										style={{
											borderColor: `${wineAccent}35`,
											color: wineAccent,
											background: `${wineAccent}08`,
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
										style={{ color: wineAccent }}
									>
										Vidos Authorizer
									</a>{" "}
									OpenAPI spec.
								</p>
							</div>

							<a
								href="https://vidos.id/docs/"
								target="_blank"
								rel="noopener noreferrer"
								className="shrink-0 text-sm font-medium hover:underline"
								style={{ color: wineAccent }}
							>
								API docs →
							</a>
						</div>

						{/* Credential overview */}
						<div
							className="mb-8 rounded-xl border p-5"
							style={{
								borderColor: "oklch(0.4 0.12 15 / 0.2)",
								background: "oklch(0.4 0.12 15 / 0.03)",
							}}
						>
							<h3 className="font-heading mb-3 text-sm font-bold">
								Credential requested
							</h3>
							<div className="grid gap-3 text-sm sm:grid-cols-2">
								<div>
									<p className="mb-0.5 text-xs font-medium text-muted-foreground">
										Credential type
									</p>
									<p className="font-mono text-xs">
										PID (Personal Identification Data)
									</p>
								</div>
								<div>
									<p className="mb-0.5 text-xs font-medium text-muted-foreground">
										Format
									</p>
									<code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">
										dc+sd-jwt
									</code>
								</div>
								<div>
									<p className="mb-0.5 text-xs font-medium text-muted-foreground">
										VCT value
									</p>
									<code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">
										urn:eudi:pid:1
									</code>
								</div>
								<div>
									<p className="mb-0.5 text-xs font-medium text-muted-foreground">
										Claim paths (by method)
									</p>
									<div className="flex flex-col gap-1">
										<code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">
											["age_equal_or_over", "&lt;minimumAge&gt;"]
										</code>
										<code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">
											["age_in_years"]
										</code>
										<code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">
											["birthdate"]
										</code>
									</div>
								</div>
							</div>
							<p className="mt-3 text-xs leading-relaxed text-muted-foreground">
								The app requests exactly one age-related PID field, based on
								user choice: <code>age_equal_or_over.&lt;minimumAge&gt;</code>,{" "}
								<code>age_in_years</code>, or <code>birthdate</code>. Acceptance
								rules are evaluated against destination legal age (18 or 21):
								<code>true</code> for <code>age_equal_or_over</code>, numeric
								value <code>&gt;= minimumAge</code> for{" "}
								<code>age_in_years</code>, or ISO date old enough for{" "}
								<code>birthdate</code>.
							</p>
						</div>

						{/* API flow steps */}
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

				{/* ── Technology callout ───────────────────────────────────── */}
				<section className="border-b border-border/50 py-16">
					<div className="mx-auto max-w-4xl px-4 sm:px-6">
						<div
							className="rounded-2xl border p-6"
							style={{
								borderColor: "oklch(0.4 0.12 15 / 0.25)",
								background: "oklch(0.4 0.12 15 / 0.04)",
							}}
						>
							<h2
								className="font-heading mb-3 text-lg font-bold"
								style={{ color: "var(--primary)" }}
							>
								About the Technology
							</h2>
							<div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
								<p>
									<strong className="text-foreground">
										EU Digital Identity Wallet (EUDIW):
									</strong>{" "}
									A standardized digital wallet mandated by eIDAS 2.0, allowing
									EU citizens to store and selectively disclose identity
									credentials.
								</p>
								<p>
									<strong className="text-foreground">
										PID (Personal ID Credential):
									</strong>{" "}
									A verifiable credential containing personal data such as name,
									date of birth, and portrait, issued by an EU member state. The
									wine shop requests one age attribute based on user choice:
									age_equal_or_over, age_in_years, or birthdate.
								</p>
								<p>
									<strong className="text-foreground">
										Selective Disclosure (SD-JWT):
									</strong>{" "}
									The PID credential uses SD-JWT format, allowing users to share
									only specific attributes. Users can pick a privacy-first
									boolean proof, a numeric age value, or full birth date when
									compatibility requires it.
								</p>
								<p>
									<strong className="text-foreground">Vidos Authorizer:</strong>{" "}
									The backend service that orchestrates the OpenID4VP
									presentation request, receives wallet responses, and evaluates
									policy checks.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* ── CTA ─────────────────────────────────────────────────── */}
				<section className="py-20">
					<div className="mx-auto max-w-xl px-4 text-center sm:px-6">
						<Separator className="mb-16 opacity-40" />

						<p
							className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest"
							style={{ color: wineAccent }}
						>
							Ready to see it?
						</p>
						<h2 className="font-heading mb-4 text-3xl font-bold tracking-tight">
							Try the demo.
						</h2>
						<p className="mb-8 text-base text-muted-foreground">
							Browse wines and verify your age with the EU Digital Wallet — end
							to end, in under two minutes.
						</p>

						<Link to="/">
							<button
								type="button"
								className="inline-flex items-center gap-2 rounded-xl px-8 py-3 font-semibold transition-opacity hover:opacity-90"
								style={{
									background: "var(--primary)",
									color: "var(--primary-foreground)",
								}}
							>
								Start Shopping
								<ArrowRight className="size-4" />
							</button>
						</Link>
					</div>
				</section>
			</main>
		</div>
	);
}
