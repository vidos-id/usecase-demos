import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	CheckCircle2,
	Code2,
	FileSearch,
	Globe,
	QrCode,
	RefreshCw,
	Shield,
	Smartphone,
} from "lucide-react";
import { GuideLayout } from "./guide-layout";

// ─── Flow step ────────────────────────────────────────────────────────────────

function FlowStep({
	number,
	icon,
	title,
	description,
	detail,
	isLast,
}: {
	number: number;
	icon: React.ReactNode;
	title: string;
	description: string;
	detail?: React.ReactNode;
	isLast?: boolean;
}) {
	return (
		<div className="flex gap-4">
			{/* Vertical connector */}
			<div className="flex flex-col items-center">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-eu-blue text-eu-blue-foreground text-sm font-bold">
					{number}
				</div>
				{!isLast && (
					<div
						className="mt-1 w-px flex-1"
						style={{
							background:
								"linear-gradient(to bottom, var(--eu-blue) 30%, transparent)",
							minHeight: "1.5rem",
						}}
					/>
				)}
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1 pb-6">
				<div className="flex items-center gap-2 mb-1">
					<span className="text-eu-blue">{icon}</span>
					<h3 className="font-semibold">{title}</h3>
				</div>
				<p className="text-sm text-muted-foreground leading-relaxed">
					{description}
				</p>
				{detail && <div className="mt-3">{detail}</div>}
			</div>
		</div>
	);
}

// ─── Protocol card ────────────────────────────────────────────────────────────

function ProtocolCard({
	title,
	description,
	href,
}: {
	title: string;
	description: string;
	href: string;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="group p-5 rounded-xl border border-border/60 bg-background hover:border-eu-blue/40 transition-colors block"
		>
			<div className="flex items-start justify-between">
				<div>
					<h3 className="font-semibold font-mono text-eu-blue">{title}</h3>
					<p className="text-sm text-muted-foreground mt-1">{description}</p>
				</div>
				<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-eu-blue transition-colors" />
			</div>
		</a>
	);
}

// ─── Audience card ────────────────────────────────────────────────────────────

function AudienceCard({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="flex gap-3 p-4 rounded-xl border border-border/60 bg-card">
			<div className="h-9 w-9 rounded-lg bg-eu-blue-light flex items-center justify-center text-eu-blue shrink-0">
				{icon}
			</div>
			<div>
				<p className="font-semibold text-sm">{label}</p>
				<p className="text-sm text-muted-foreground mt-0.5">{value}</p>
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HowDemosWorkPage() {
	return (
		<GuideLayout>
			<div className="space-y-12">
				{/* Page header */}
				<header className="space-y-4">
					<p className="mono-label">How Demos Work</p>
					<h1 className="heading-mixed">
						The demo <strong>verification flow</strong>
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
						Every Vidos demo follows the same fundamental pattern: a relying
						party requests credentials from your wallet using the OpenID4VP
						protocol, your wallet presents them, and the result drives the
						business flow.
					</p>

					{/* Executive summary */}
					<div className="rounded-xl bg-eu-blue-light border border-eu-blue/20 p-5 space-y-2">
						<p className="font-semibold text-eu-blue text-sm">
							What these demos prove
						</p>
						<p className="text-sm text-foreground/80 leading-relaxed">
							Each demo is a reference implementation of a real-world eIDAS 2.0
							use case. They show how a business can integrate the{" "}
							<strong>Vidos Authorizer API</strong> to request, verify, and act
							on cryptographically signed credentials from a user's EUDI Wallet
							— without collecting or storing personal data.
						</p>
					</div>
				</header>

				{/* Audience */}
				<section className="space-y-4">
					<p className="mono-label">Who is this for?</p>
					<div className="grid sm:grid-cols-2 gap-3">
						<AudienceCard
							icon={<Shield className="h-5 w-5" />}
							label="Executives & Evaluators"
							value="See the end-to-end user journey and understand the compliance value of wallet-based identity."
						/>
						<AudienceCard
							icon={<Code2 className="h-5 w-5" />}
							label="Developers"
							value="Explore how the Vidos Authorizer API integrates into a frontend — inspect the source code and API calls."
						/>
						<AudienceCard
							icon={<Globe className="h-5 w-5" />}
							label="Wallet Providers"
							value="Test interoperability of your wallet with the OID4VP and DC API protocols used in each demo."
						/>
						<AudienceCard
							icon={<CheckCircle2 className="h-5 w-5" />}
							label="Issuers"
							value="Understand what attributes relying parties will request and how credentials are used in practice."
						/>
					</div>
				</section>

				{/* The universal demo flow */}
				<section className="space-y-4">
					<div>
						<p className="mono-label mb-1">The universal verification flow</p>
						<p className="text-sm text-muted-foreground">
							Every demo follows these steps, regardless of the use case.
						</p>
					</div>

					<div className="rounded-xl border border-border/60 bg-card p-6">
						<FlowStep
							number={1}
							icon={<Code2 className="h-5 w-5" />}
							title="Demo triggers an authorization request"
							description="When you initiate a verification action (e.g., sign up, book, verify), the demo app calls the Vidos Authorizer API to create a credential request. The request specifies which credential attributes are required."
						/>
						<FlowStep
							number={2}
							icon={<QrCode className="h-5 w-5" />}
							title="QR code or deep link is presented"
							description="The Authorizer API returns an authorization URL. The demo renders it as a QR code on screen or as a deep link on mobile. Your wallet scans or follows the link to receive the request."
						/>
						<FlowStep
							number={3}
							icon={<Smartphone className="h-5 w-5" />}
							title="Wallet prompts for consent"
							description="Your EUDI Wallet displays the requested attributes and asks for your consent before sharing anything. You choose to approve or reject."
						/>
						<FlowStep
							number={4}
							icon={<RefreshCw className="h-5 w-5" />}
							title="Demo polls for authorization status"
							description="While you interact with your wallet, the demo polls the Authorizer API for the status of the request. Possible states: pending_wallet → authorized / rejected / expired / error."
						/>
						<FlowStep
							number={5}
							icon={<FileSearch className="h-5 w-5" />}
							title="Policy response and credentials are retrieved"
							description="On success, the demo fetches the policy response (cryptographic validity, integrity, and trusted-issuer checks) and the disclosed credential claims. These drive the business outcome."
							isLast
						/>
					</div>
				</section>

				{/* Technical notes */}
				<section className="space-y-4">
					<p className="mono-label">Developer detail</p>

					<div className="space-y-3">
						<div className="rounded-xl border border-border/60 bg-card p-5 space-y-2">
							<h3 className="font-semibold text-sm">Transport modes</h3>
							<div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
								<div className="space-y-1">
									<p className="font-medium text-foreground">
										OID4VP direct_post
									</p>
									<p>
										Wallet posts the presentation directly to the Authorizer
										backend. Works with all compatible wallets. Used in all
										demos.
									</p>
								</div>
								<div className="space-y-1">
									<p className="font-medium text-foreground">
										DC API (Digital Credentials API)
									</p>
									<p>
										Browser-native credential exchange on Chrome for Android.
										Eliminates the QR scan step on mobile. Supported by Multipaz
										and Valera.
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Standards reference */}
				<section className="space-y-4">
					<div>
						<p className="mono-label mb-1">Standards & protocols</p>
						<p className="text-sm text-muted-foreground">
							These demos implement the following open standards.
						</p>
					</div>
					<div className="grid sm:grid-cols-2 gap-3">
						<ProtocolCard
							title="OID4VP"
							description="OpenID for Verifiable Presentations — credential presentation standard"
							href="https://openid.net/specs/openid-4-verifiable-presentations-1_0.html"
						/>
						<ProtocolCard
							title="DC API"
							description="Digital Credentials API — browser-native credential exchange"
							href="https://wicg.github.io/digital-credentials/"
						/>
						<ProtocolCard
							title="PID Rulebook"
							description="Official EU specification for Person Identification Data attributes and encoding"
							href="https://eudi.dev/latest/annexes/annex-3/annex-3.01-pid-rulebook/"
						/>
						<ProtocolCard
							title="ARF Documentation"
							description="Architecture and Reference Framework for the EUDI Wallet ecosystem"
							href="https://eudi.dev/latest/"
						/>
					</div>
				</section>

				{/* Next steps */}
				<section className="pt-4 border-t border-border/40">
					<p className="mono-label mb-3">Get started</p>
					<div className="grid sm:grid-cols-2 gap-4">
						<Link
							to="/wallet-setup"
							className="group flex items-center justify-between p-5 rounded-xl border border-border/60 hover:border-eu-blue/40 transition-colors"
						>
							<div>
								<p className="font-semibold">Wallet Setup</p>
								<p className="text-sm text-muted-foreground mt-0.5">
									Install a compatible EUDI Wallet
								</p>
							</div>
							<ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-eu-blue transition-colors" />
						</Link>
						<Link
							to="/credential-prep"
							className="group flex items-center justify-between p-5 rounded-xl border border-border/60 hover:border-eu-blue/40 transition-colors"
						>
							<div>
								<p className="font-semibold">Credential Preparation</p>
								<p className="text-sm text-muted-foreground mt-0.5">
									Issue test credentials into your wallet
								</p>
							</div>
							<ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-eu-blue transition-colors" />
						</Link>
					</div>
				</section>
			</div>
		</GuideLayout>
	);
}
