import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BadgeCheck,
	Car,
	CreditCard,
	ExternalLink,
	FileText,
	Globe,
	ShieldCheck,
} from "lucide-react";
import { GuideLayout } from "./guide-layout";

// ─── Env-backed demo URLs ─────────────────────────────────────────────────────

const carRentalUrl =
	import.meta.env.VITE_CAR_RENTAL_URL ?? "http://localhost:29750/car-rental/";
const demoBankUrl =
	import.meta.env.VITE_DEMO_BANK_URL ?? "http://localhost:55930/bank/";

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

// ─── Credential card ──────────────────────────────────────────────────────────

interface DemoLink {
	label: string;
	href: string;
}

function CredentialCard({
	icon,
	name,
	standard,
	description,
	liveIn,
	comingSoonIn,
}: {
	icon: React.ReactNode;
	name: string;
	standard: string;
	description: string;
	/** Live demos that use this credential (with links) */
	liveIn?: DemoLink[];
	/** Upcoming demos that will use this credential */
	comingSoonIn?: string[];
}) {
	return (
		<div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
			<div className="flex items-start gap-3">
				<div className="h-10 w-10 rounded-lg bg-eu-blue-light flex items-center justify-center text-eu-blue shrink-0">
					{icon}
				</div>
				<div>
					<h3 className="font-semibold">{name}</h3>
					<p className="text-xs font-mono text-muted-foreground mt-0.5">
						{standard}
					</p>
				</div>
			</div>
			<p className="text-sm text-muted-foreground leading-relaxed">
				{description}
			</p>
			{liveIn && liveIn.length > 0 && (
				<div>
					<p className="text-xs text-muted-foreground/60 uppercase tracking-wider font-mono mb-1.5">
						Live demos
					</p>
					<div className="flex flex-wrap gap-1.5">
						{liveIn.map((demo) => (
							<a
								key={demo.label}
								href={demo.href}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-eu-blue-light text-eu-blue text-xs font-medium hover:bg-eu-blue/20 transition-colors"
							>
								{demo.label}
								<ExternalLink className="h-2.5 w-2.5" />
							</a>
						))}
					</div>
				</div>
			)}
			{comingSoonIn && comingSoonIn.length > 0 && (
				<div>
					<p className="text-xs text-muted-foreground/60 uppercase tracking-wider font-mono mb-1.5">
						Coming soon
					</p>
					<div className="flex flex-wrap gap-1.5">
						{comingSoonIn.map((item) => (
							<span
								key={item}
								className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs"
							>
								{item}
							</span>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ─── Issuer card ──────────────────────────────────────────────────────────────

function IssuerCard({
	name,
	description,
	href,
	credentialsOffered,
}: {
	name: string;
	description: string;
	href: string;
	credentialsOffered: string[];
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="group flex flex-col gap-3 p-5 rounded-xl border border-border/60 hover:border-eu-blue/40 transition-colors"
		>
			<div className="flex items-start justify-between">
				<div>
					<p className="font-semibold group-hover:text-eu-blue transition-colors">
						{name}
					</p>
					<p className="text-sm text-muted-foreground mt-0.5">{description}</p>
				</div>
				<ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-eu-blue transition-colors shrink-0" />
			</div>
			<div className="flex flex-wrap gap-1.5">
				{credentialsOffered.map((c) => (
					<span
						key={c}
						className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-mono"
					>
						{c}
					</span>
				))}
			</div>
		</a>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CredentialPrepPage() {
	return (
		<GuideLayout>
			<div className="space-y-12">
				{/* Page header */}
				<header className="space-y-4">
					<p className="mono-label">Credential Preparation</p>
					<h1 className="heading-mixed">
						Issue your <strong>test credentials</strong>
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
						Before trying the demos, you need verifiable credentials loaded into
						your EUDI Wallet. These are test credentials issued by EU-operated
						or community issuers — no real documents required.
					</p>

					{/* Executive context */}
					<div className="rounded-xl bg-eu-blue-light border border-eu-blue/20 p-5 space-y-2">
						<p className="font-semibold text-eu-blue text-sm">
							What is a verifiable credential?
						</p>
						<p className="text-sm text-foreground/80 leading-relaxed">
							A verifiable credential (VC) is a tamper-proof digital document
							issued by a trusted authority — similar to a passport or driving
							licence but in digital form. The demos use test VCs to simulate
							the same cryptographic verification a real-world relying party
							would perform under eIDAS 2.0.
						</p>
					</div>
				</header>

				{/* Credential types */}
				<section className="space-y-4">
					<div>
						<p className="mono-label mb-1">Credential types used in demos</p>
						<p className="text-sm text-muted-foreground">
							Different demos request different credential types. Click a demo
							badge to go straight to it.
						</p>
					</div>
					<div className="grid sm:grid-cols-2 gap-4">
						<CredentialCard
							icon={<ShieldCheck className="h-5 w-5" />}
							name="PID — Person Identification Data"
							standard="SD-JWT VC / MSO mDoc"
							description="The foundational EU Digital Identity credential. Required claims vary by flow — sign-up requests: given_name, family_name, birth_date, nationality, personal_administrative_number, document_number, portrait. Sign-in only needs personal_administrative_number. Payment/loan requests given_name, family_name, personal_administrative_number."
							liveIn={[{ label: "VidosDemoBank", href: demoBankUrl }]}
							comingSoonIn={["Age Verification", "Online Services"]}
						/>
						<CredentialCard
							icon={<Car className="h-5 w-5" />}
							name="mDL — Mobile Driving Licence"
							standard="ISO 18013-5 mDoc"
							description="Required claims: given_name, family_name, birth_date, document_number, expiry_date, driving_privileges (all required). Portrait is optional. The demo checks that driving_privileges contains a category matching the selected vehicle (e.g. category B for standard cars)."
							liveIn={[{ label: "Car Rental Demo", href: carRentalUrl }]}
							comingSoonIn={["Proximity ID", "Vehicle Registration"]}
						/>
						<CredentialCard
							icon={<CreditCard className="h-5 w-5" />}
							name="Age Over Attestation"
							standard="SD-JWT VC"
							description="A minimal credential that attests the holder is above a given age without disclosing the exact birth date. Enables selective disclosure."
							comingSoonIn={["Age Verification Demo"]}
						/>
						<CredentialCard
							icon={<Globe className="h-5 w-5" />}
							name="ELM — European Learning Model"
							standard="SD-JWT VC"
							description="An educational credential recording qualifications, diplomas, and micro-credentials in a standardized EU format."
							comingSoonIn={[
								"Educational Credentials Demo",
								"European Student Card",
							]}
						/>
					</div>
				</section>

				{/* Test issuers */}
				<section className="space-y-4">
					<div>
						<p className="mono-label mb-1">Test issuers</p>
						<p className="text-sm text-muted-foreground">
							Use these issuers to obtain test credentials for any of the demos.
							No real personal data is required — you can use fictional values.
						</p>
					</div>
					<div className="space-y-3">
						<IssuerCard
							name="EUDIW Dev Issuer"
							description="Official EU reference issuer for PID and mDL credentials. Supports Pre-Authorization Code Grant."
							href="https://issuer.eudiw.dev"
							credentialsOffered={[
								"PID (SD-JWT)",
								"PID (mDoc)",
								"mDL (mDoc)",
								"Age Over",
							]}
						/>
						<IssuerCard
							name="Multipaz In-App Document Store"
							description="Built into the Multipaz wallet app — issue test PID and mDL directly without leaving the wallet."
							href="https://apps.multipaz.org/"
							credentialsOffered={["PID (SD-JWT)", "PID (mDoc)", "mDL (mDoc)"]}
						/>
						<IssuerCard
							name="Valera Issuance Guide"
							description="A-SIT Plus issuer for Valera wallet users. Follow the step-by-step issuance guide."
							href="https://wallet.a-sit.at/guide-issue.html"
							credentialsOffered={["PID (SD-JWT)", "PID (mDoc)"]}
						/>
					</div>
				</section>

				{/* Step-by-step for PID via EUDIW issuer */}
				<section className="space-y-4">
					<div>
						<p className="mono-label mb-1">
							Step-by-step: Issue a PID via EUDIW Dev Issuer
						</p>
						<p className="text-sm text-muted-foreground">
							The most common credential needed for the demos. Works with EUDI
							Wallet. Required for{" "}
							<a
								href={demoBankUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-eu-blue hover:underline inline-flex items-center gap-0.5"
							>
								VidosDemoBank
								<ExternalLink className="h-3 w-3" />
							</a>
							.
						</p>
					</div>
					<div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
						<div className="flex items-center gap-3 mb-2">
							<FileText className="h-5 w-5 text-eu-blue" />
							<p className="font-semibold">Issuing a PID from EUDIW Dev</p>
						</div>
						<ol className="space-y-3">
							<StepItem number={1}>
								Open{" "}
								<a
									href="https://issuer.eudiw.dev"
									target="_blank"
									rel="noopener noreferrer"
									className="text-eu-blue hover:underline"
								>
									issuer.eudiw.dev
								</a>{" "}
								in your browser
							</StepItem>
							<StepItem number={2}>
								Select <strong>PID (SD-JWT VC)</strong> or{" "}
								<strong>PID (MSO mDoc)</strong> — both formats are accepted
							</StepItem>
							<StepItem number={3}>
								Choose <strong>Pre-Authorization Code Grant</strong> — lets you
								fill in the form on your PC
							</StepItem>
							<StepItem number={4}>
								Fill in the required claims:{" "}
								<strong>
									given_name, family_name, birth_date, nationality,
									document_number
								</strong>
							</StepItem>
							<StepItem number={5}>
								Add <strong>personal_administrative_number</strong> from the
								optional fields — this becomes your unique account ID for
								sign-in, payment, and loan flows in{" "}
								<a
									href={demoBankUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-eu-blue hover:underline"
								>
									VidosDemoBank
								</a>
								. Also add <strong>portrait</strong> (photo) if you want it
								shown during sign-up and profile update.
							</StepItem>
							<StepItem number={6}>
								Click <strong>Confirm</strong> — a QR code appears
							</StepItem>
							<StepItem number={7}>
								Open your EUDI Wallet on your phone → Document tab → + icon →
								Scan → scan the QR code and enter the provided PIN
							</StepItem>
						</ol>
					</div>
				</section>

				{/* Step-by-step for mDL */}
				<section className="space-y-4">
					<div>
						<p className="mono-label mb-1">
							Step-by-step: Issue an mDL via EUDIW Dev Issuer
						</p>
						<p className="text-sm text-muted-foreground">
							Required for the{" "}
							<a
								href={carRentalUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-eu-blue hover:underline inline-flex items-center gap-0.5"
							>
								Car Rental Demo
								<ExternalLink className="h-3 w-3" />
							</a>
							.
						</p>
					</div>
					<div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
						<div className="flex items-center gap-3 mb-2">
							<Car className="h-5 w-5 text-eu-blue" />
							<p className="font-semibold">Issuing an mDL from EUDIW Dev</p>
						</div>
						<ol className="space-y-3">
							<StepItem number={1}>
								Open{" "}
								<a
									href="https://issuer.eudiw.dev"
									target="_blank"
									rel="noopener noreferrer"
									className="text-eu-blue hover:underline"
								>
									issuer.eudiw.dev
								</a>{" "}
								and select <strong>mDL (MSO mDoc)</strong>
							</StepItem>
							<StepItem number={2}>
								Choose <strong>Pre-Authorization Code Grant</strong>
							</StepItem>
							<StepItem number={3}>
								Fill in the required mDL claims:{" "}
								<strong>
									given_name, family_name, birth_date, document_number,
									expiry_date
								</strong>
							</StepItem>
							<StepItem number={4}>
								Add <strong>driving_privileges</strong> with at least one
								licence category (e.g.{" "}
								<code className="text-xs bg-muted px-1 rounded">B</code> for
								standard cars) — the demo checks that your licence category
								covers the selected vehicle. <strong>portrait</strong> is
								optional.
							</StepItem>
							<StepItem number={5}>
								Click <strong>Confirm</strong> and scan the QR code into your
								EUDI Wallet
							</StepItem>
						</ol>
					</div>
				</section>

				{/* Regulatory context */}
				<section className="rounded-xl bg-muted/30 border border-border/40 p-5 space-y-3">
					<div className="flex items-center gap-2">
						<BadgeCheck className="h-5 w-5 text-eu-blue" />
						<h3 className="font-semibold text-sm">eIDAS 2.0 Timeline</h3>
					</div>
					<div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
						<div className="space-y-1">
							<p className="font-medium text-foreground">
								Dec 2026 — Public Sector
							</p>
							<p>Government services must accept EUDI Wallet credentials</p>
						</div>
						<div className="space-y-1">
							<p className="font-medium text-foreground">
								Dec 2027 — Private Sector
							</p>
							<p>
								Banks and major platforms must accept wallet credentials for SCA
							</p>
						</div>
					</div>
					<p className="text-xs text-muted-foreground/70">
						Non-compliance: up to 5M EUR or 1% annual turnover (Article 16,
						Regulation EU 2024/1183)
					</p>
				</section>

				{/* Next step */}
				<section className="pt-4 border-t border-border/40">
					<p className="mono-label mb-3">Next step</p>
					<div className="grid sm:grid-cols-2 gap-4">
						<Link
							to="/wallet-setup"
							className="group flex items-center justify-between p-5 rounded-xl border border-border/60 hover:border-eu-blue/40 transition-colors"
						>
							<div>
								<p className="font-semibold">Wallet Setup</p>
								<p className="text-sm text-muted-foreground mt-0.5">
									Need to install a wallet first?
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
									Understand the verification flow end-to-end
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
