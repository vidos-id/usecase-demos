import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	CheckCircle2,
	Download,
	ExternalLink,
	QrCode,
	Shield,
	Smartphone,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { GuideLayout } from "./guide-layout";

// ─── Shared primitives ────────────────────────────────────────────────────────

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

function Callout({
	children,
	variant = "info",
}: {
	children: React.ReactNode;
	variant?: "info" | "warning" | "tip";
}) {
	const variants = {
		info: "bg-primary/5 border-primary/20 text-foreground/80",
		warning:
			"bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200",
		tip: "bg-green-500/10 border-green-500/20 text-green-900 dark:text-green-200",
	};
	return (
		<div
			className={cn(
				"mt-3 p-3 rounded-lg border text-sm leading-relaxed",
				variants[variant],
			)}
		>
			{children}
		</div>
	);
}

function LinkButton({
	href,
	icon,
	children,
}: {
	href: string;
	icon: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-eu-blue text-eu-blue-foreground text-sm font-medium hover:bg-eu-blue-dark transition-colors mt-3"
		>
			{icon}
			{children}
		</a>
	);
}

function MethodCard({
	icon,
	title,
	description,
	note,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	note: string;
}) {
	return (
		<div className="p-4 rounded-xl bg-muted/30 border border-border/40">
			<div className="flex items-start gap-3">
				<div className="h-10 w-10 rounded-lg bg-eu-blue-light flex items-center justify-center text-eu-blue shrink-0">
					{icon}
				</div>
				<div>
					<h4 className="font-semibold text-foreground">{title}</h4>
					<p className="text-sm text-muted-foreground mt-1">{description}</p>
					<p className="text-xs text-muted-foreground/70 mt-2 italic">{note}</p>
				</div>
			</div>
		</div>
	);
}

// ─── Wallet section wrapper ───────────────────────────────────────────────────

function WalletSection({
	icon,
	name,
	tagline,
	compatibility,
	downloadUrl,
	downloadLabel,
	steps,
}: {
	icon: React.ReactNode;
	name: string;
	tagline: string;
	compatibility: string;
	downloadUrl: string;
	downloadLabel: string;
	steps: Array<{ title: string; content: React.ReactNode }>;
}) {
	return (
		<div className="space-y-4">
			{/* Header card */}
			<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-eu-blue-light to-background border border-border/60 p-6">
				<div className="absolute top-0 right-0 w-48 h-48 bg-eu-blue/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
				<div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="h-14 w-14 rounded-2xl bg-eu-blue-light border border-eu-blue/20 flex items-center justify-center text-eu-blue">
							{icon}
						</div>
						<div>
							<h3 className="text-xl font-bold tracking-tight">{name}</h3>
							<p className="text-sm text-muted-foreground">{tagline}</p>
						</div>
					</div>
					<div className="flex flex-col sm:items-end gap-2">
						<span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
							<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
							{compatibility}
						</span>
						<a
							href={downloadUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-medium hover:border-eu-blue/40 transition-colors"
						>
							<Download className="h-4 w-4" />
							{downloadLabel}
						</a>
					</div>
				</div>
			</div>

			{/* Steps */}
			<div className="space-y-3">
				{steps.map((step, index) => (
					<div
						key={step.title}
						className="rounded-xl border border-border/60 bg-background overflow-hidden"
					>
						<div className="w-full flex items-center gap-4 p-4 text-left">
							<div className="h-8 w-8 rounded-lg bg-eu-blue-light flex items-center justify-center text-eu-blue font-mono text-sm font-bold shrink-0">
								{index + 1}
							</div>
							<span className="font-semibold flex-1">{step.title}</span>
						</div>
						<div className="px-4 pb-4 pl-16 text-sm text-muted-foreground space-y-4">
							{step.content}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── EUDI Wallet guide ────────────────────────────────────────────────────────

function EudiWalletGuide() {
	return (
		<WalletSection
			icon={<Shield className="h-6 w-6" />}
			name="EUDI Wallet"
			tagline="EU Reference Implementation"
			compatibility="direct_post"
			downloadUrl="https://github.com/vidos-id/eudi-app-android-wallet-ui/releases"
			downloadLabel="View GitHub Releases"
			steps={[
				{
					title: "Install the Vidos EUDI Wallet",
					content: (
						<>
							<p>
								Download the Vidos-customized EUDI wallet APK from our GitHub
								releases.
							</p>
							<LinkButton
								href="https://github.com/vidos-id/eudi-app-android-wallet-ui/releases"
								icon={<Download className="h-4 w-4" />}
							>
								View GitHub Releases
							</LinkButton>
						</>
					),
				},
				{
					title: "Issue credentials",
					content: (
						<>
							<p>
								Navigate to the EU issuer portal and issue the credentials you
								need for the demos you want to try.
							</p>
							<div className="space-y-3">
								<LinkButton
									href="https://issuer.eudiw.dev"
									icon={<ExternalLink className="h-4 w-4" />}
								>
									Open Credential Offer Page
								</LinkButton>
								<Callout>
									<strong>EUDI's guide:</strong>{" "}
									<a
										href="https://issuer.eudiw.dev/static/issuer_guides/credential_offer_guide_pre_auth.html"
										target="_blank"
										rel="noopener noreferrer"
										className="underline underline-offset-2 hover:text-eu-blue transition-colors"
									>
										Credential Offer Guide (Pre-Auth)
									</a>
								</Callout>
							</div>
						</>
					),
				},
				{
					title: "Configure a PID credential (VidosDemoBank)",
					content: (
						<ol className="space-y-3">
							<StepItem number={1}>
								Select <strong>PID (SD-JWT VC)</strong> or{" "}
								<strong>PID (MSO mDoc)</strong> — both formats are accepted
							</StepItem>
							<StepItem number={2}>
								Choose <strong>Pre-Authorization Code Grant</strong>
								<span className="block text-sm text-muted-foreground mt-1">
									This lets you fill the form on your PC instead of your phone
								</span>
							</StepItem>
							<StepItem number={3}>
								Fill in required claims:{" "}
								<strong>
									given_name, family_name, birth_date, nationality,
									document_number
								</strong>
							</StepItem>
							<StepItem number={4}>
								Add <strong>personal_administrative_number</strong> from
								optional fields — this is your unique account ID for sign-in,
								payment, and loan flows.
							</StepItem>
							<StepItem number={5}>
								Add <strong>portrait</strong> (photo) — shown during sign-up and
								profile update flows
							</StepItem>
							<StepItem number={6}>
								Click <strong>Confirm</strong> to generate the credential offer
							</StepItem>
						</ol>
					),
				},
				{
					title: "Configure an mDL credential (Car Rental)",
					content: (
						<ol className="space-y-3">
							<StepItem number={1}>
								Select <strong>mDL (MSO mDoc)</strong> from the credential list
							</StepItem>
							<StepItem number={2}>
								Choose <strong>Pre-Authorization Code Grant</strong>
							</StepItem>
							<StepItem number={3}>
								Fill in required claims:{" "}
								<strong>
									given_name, family_name, birth_date, document_number,
									expiry_date
								</strong>
							</StepItem>
							<StepItem number={4}>
								Add <strong>driving_privileges</strong> with at least one
								category (e.g.{" "}
								<code className="text-xs bg-muted px-1 rounded">B</code>) — the
								car rental demo verifies the category matches the selected
								vehicle. <strong>portrait</strong> is optional.
							</StepItem>
							<StepItem number={5}>
								Click <strong>Confirm</strong> to generate the credential offer
							</StepItem>
						</ol>
					),
				},
				{
					title: "Add Credential to Wallet",
					content: (
						<ol className="space-y-3">
							<StepItem number={1}>Open the EUDI wallet on your phone</StepItem>
							<StepItem number={2}>
								Go to <strong>Document</strong> tab
							</StepItem>
							<StepItem number={3}>
								Tap the <strong>+</strong> icon in the top right
							</StepItem>
							<StepItem number={4}>
								Select <strong>Scan</strong>
							</StepItem>
							<StepItem number={5}>
								Scan the QR code from your PC and enter the provided PIN
							</StepItem>
						</ol>
					),
				},
				{
					title: "Use with a Demo",
					content: (
						<>
							<p>
								Once your credential is loaded, you are ready to use it with any
								of the Vidos demos.
							</p>
							<ol className="space-y-3 mt-4">
								<StepItem number={1}>
									On your phone's EUDI wallet Home screen, tap{" "}
									<strong>Authenticate</strong>
								</StepItem>
								<StepItem number={2}>
									When the snackbar appears, select <strong>Online</strong>
								</StepItem>
								<StepItem number={3}>
									Scan the QR code displayed in the demo app
								</StepItem>
							</ol>
							<Callout variant="tip">
								Start with the demo onboarding flow, then explore available
								scenarios!
							</Callout>
						</>
					),
				},
			]}
		/>
	);
}

// ─── Multipaz Wallet guide ────────────────────────────────────────────────────

function MultipazWalletGuide() {
	return (
		<WalletSection
			icon={<Wallet className="h-6 w-6" />}
			name="Multipaz Wallet"
			tagline="Cross-Platform Identity"
			compatibility="direct_post + DC API (Chrome)"
			downloadUrl="https://apps.multipaz.org/"
			downloadLabel="View Downloads Page"
			steps={[
				{
					title: "Install Multipaz Wallet",
					content: (
						<>
							<p>Download the Multipaz wallet from the official portal.</p>
							<LinkButton
								href="https://apps.multipaz.org/"
								icon={<Download className="h-4 w-4" />}
							>
								View Downloads Page
							</LinkButton>
						</>
					),
				},
				{
					title: "Issue credentials",
					content: (
						<>
							<p>
								Multipaz includes a built-in document store for issuing test
								credentials in both SD-JWT and mDoc formats.
							</p>
							<ol className="space-y-3 mt-4">
								<StepItem number={1}>Open the Multipaz app</StepItem>
								<StepItem number={2}>
									Navigate to the <strong>Document Store</strong>
								</StepItem>
								<StepItem number={3}>
									Issue a <strong>PID</strong> credential (SD-JWT or mDoc) for
									VidosDemoBank — make sure to include{" "}
									<strong>personal_administrative_number</strong> as your
									account ID
								</StepItem>
								<StepItem number={4}>
									Issue an <strong>mDL</strong> credential if you want to try
									the Car Rental demo — include{" "}
									<strong>driving_privileges</strong> with a licence category
									(e.g. <code className="text-xs bg-muted px-1 rounded">B</code>
									)
								</StepItem>
							</ol>
						</>
					),
				},
				{
					title: "Triggering Authentication",
					content: (
						<>
							<p>
								Multipaz doesn't have a built-in QR scanner for OID4VP/DC API
								flows. Here are your options:
							</p>
							<div className="space-y-4 mt-4">
								<MethodCard
									icon={<QrCode className="h-5 w-5" />}
									title="Option A: External QR Scanner"
									description="Use your phone's camera or a QR scanner app to scan the code, then choose Multipaz to handle the link."
									note="Works reliably with direct_post. DC API support varies by scanner."
								/>
								<MethodCard
									icon={<Smartphone className="h-5 w-5" />}
									title="Option B: Deep Link"
									description="Navigate to the demo directly on your phone and use the built-in deep link feature."
									note="Works on mobile browsers and supports direct_post and DC API."
								/>
								<MethodCard
									icon={<Smartphone className="h-5 w-5" />}
									title="Option C: DC API on Chrome"
									description="Open the demo in Chrome on Android and start authentication to use the browser-native credential exchange."
									note="An alternative to QR scanning and deep links when Chrome prompts for Multipaz."
								/>
							</div>
						</>
					),
				},
			]}
		/>
	);
}

// ─── Valera Wallet guide ──────────────────────────────────────────────────────

function ValeraWalletGuide() {
	return (
		<WalletSection
			icon={<Smartphone className="h-6 w-6" />}
			name="Valera Wallet"
			tagline="A-SIT Plus Wallet Demonstrator"
			compatibility="direct_post + DC API"
			downloadUrl="https://wallet.a-sit.at/"
			downloadLabel="Open Wallet Site"
			steps={[
				{
					title: "Install Valera Wallet",
					content: (
						<>
							<p>
								Download Valera from the official wallet site (Android APK or
								iOS TestFlight).
							</p>
							<LinkButton
								href="https://wallet.a-sit.at/"
								icon={<Download className="h-4 w-4" />}
							>
								Open Wallet Site
							</LinkButton>
						</>
					),
				},
				{
					title: "Issue credentials",
					content: (
						<>
							<p>
								Use the Valera issuing flow to load credentials into the wallet.
								For VidosDemoBank, issue a <strong>PID</strong> and include{" "}
								<strong>personal_administrative_number</strong> as your account
								ID. For the Car Rental demo, also issue an <strong>mDL</strong>{" "}
								with <strong>driving_privileges</strong> set to your licence
								category.
							</p>
							<div className="space-y-3">
								<LinkButton
									href="https://wallet.a-sit.at/guide-issue.html"
									icon={<ExternalLink className="h-4 w-4" />}
								>
									Open Issuance Guide
								</LinkButton>
							</div>
						</>
					),
				},
				{
					title: "Authenticate with a Demo",
					content: (
						<>
							<ol className="space-y-3">
								<StepItem number={1}>
									Start an authentication flow in the demo app
								</StepItem>
								<StepItem number={2}>
									Open Valera and scan the QR code (or continue through deep
									link)
								</StepItem>
								<StepItem number={3}>
									Choose exactly one credential format: <strong>SD-JWT</strong>{" "}
									or <strong>mDoc</strong>
								</StepItem>
							</ol>
							<Callout variant="warning">
								<strong>Important:</strong> Valera currently does not support
								complex DCQL queries with credential sets. Select either SD-JWT
								or mDoc only when prompted.
							</Callout>
						</>
					),
				},
			]}
		/>
	);
}

// ─── Wallet tab selector ──────────────────────────────────────────────────────

const wallets = [
	{ id: "eudi", label: "EUDI Wallet", icon: <Shield className="h-4 w-4" /> },
	{
		id: "multipaz",
		label: "Multipaz",
		icon: <Wallet className="h-4 w-4" />,
	},
	{ id: "valera", label: "Valera", icon: <Smartphone className="h-4 w-4" /> },
] as const;

type WalletId = (typeof wallets)[number]["id"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WalletSetupPage() {
	const [activeWallet, setActiveWallet] = useState<WalletId>("eudi");

	return (
		<GuideLayout>
			<div className="space-y-12">
				{/* Page header */}
				<header className="space-y-4">
					<p className="mono-label">Wallet Setup</p>
					<h1 className="heading-mixed">
						Set up your <strong>EUDI Wallet</strong>
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
						Choose a compatible EU Digital Identity Wallet, install it on your
						device, and load your test credentials — then you're ready to try
						any of the demos.
					</p>

					{/* Executive summary */}
					<div className="rounded-xl bg-eu-blue-light border border-eu-blue/20 p-5 space-y-2">
						<p className="font-semibold text-eu-blue text-sm">
							Why do you need a wallet?
						</p>
						<p className="text-sm text-foreground/80 leading-relaxed">
							The EU Digital Identity Wallet is the holder application that
							stores your verifiable credentials (PID, driving licence, etc.)
							and responds to verification requests from relying parties. It is
							the user-side of eIDAS 2.0 credential presentations — the demos
							show the relying-party side.
						</p>
					</div>
				</header>

				{/* Wallet picker */}
				<section>
					<p className="mono-label mb-4">Choose your wallet</p>

					<div className="flex gap-2 p-1 rounded-xl bg-muted/50 border border-border/60 w-fit mb-8">
						{wallets.map((w) => (
							<button
								key={w.id}
								type="button"
								onClick={() => setActiveWallet(w.id)}
								className={cn(
									"flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200",
									activeWallet === w.id
										? "bg-background border border-border/60 shadow-sm text-eu-blue"
										: "hover:bg-background/50 text-muted-foreground",
								)}
							>
								{w.icon}
								<span className="font-medium text-sm">{w.label}</span>
							</button>
						))}
					</div>

					{activeWallet === "eudi" && <EudiWalletGuide />}
					{activeWallet === "multipaz" && <MultipazWalletGuide />}
					{activeWallet === "valera" && <ValeraWalletGuide />}
				</section>

				{/* Next step CTA */}
				<section className="pt-4 border-t border-border/40">
					<p className="mono-label mb-3">Next step</p>
					<div className="grid sm:grid-cols-2 gap-4">
						<Link
							to="/credential-prep"
							className="group flex items-center justify-between p-5 rounded-xl border border-border/60 hover:border-eu-blue/40 transition-colors"
						>
							<div>
								<p className="font-semibold">Credential Preparation</p>
								<p className="text-sm text-muted-foreground mt-0.5">
									Learn how to issue test credentials into your wallet
								</p>
							</div>
							<ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-eu-blue transition-colors" />
						</Link>
						<Link
							to="/how-demos-work"
							className="group flex items-center justify-between p-5 rounded-xl border border-border/60 hover:border-eu-blue/40 transition-colors"
						>
							<div>
								<p className="font-semibold">How Demos Work</p>
								<p className="text-sm text-muted-foreground mt-0.5">
									Understand the verification flow before you try it
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
