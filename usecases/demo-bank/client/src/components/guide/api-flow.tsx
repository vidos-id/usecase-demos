import {
	CheckCircle2,
	Code2,
	FileSearch,
	RefreshCw,
	Shield,
	Smartphone,
	XCircle,
	Zap,
} from "lucide-react";
import { SectionHeader } from "./shared";

// ─── Endpoint block ───────────────────────────────────────────────────────────

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

// ─── Status badge row ─────────────────────────────────────────────────────────

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

// ─── PID claim badge row ──────────────────────────────────────────────────────

function PidClaimBadges() {
	const claims = [
		"given_name",
		"family_name",
		"birth_date",
		"personal_administrative_number",
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
			<div className="flex flex-col items-center">
				<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
					{number}
				</div>
				{!isLast && (
					<div
						className="mt-1 w-px flex-1"
						style={{
							background:
								"linear-gradient(to bottom, var(--primary) 30%, transparent)",
							minHeight: "1.5rem",
						}}
					/>
				)}
			</div>
			<div className="min-w-0 flex-1 pb-5">
				<div className="mb-1 flex items-center gap-2">
					<span className="text-primary">{icon}</span>
					<h4 className="font-semibold text-sm">{title}</h4>
				</div>
				<p className="text-sm text-muted-foreground leading-relaxed">
					{description}
				</p>
				{detail}
			</div>
		</div>
	);
}

// ─── Business outcome cards ───────────────────────────────────────────────────

function OutcomeCard({
	icon,
	title,
	description,
	variant,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	variant: "success" | "failure";
}) {
	const colors = {
		success: {
			bg: "bg-green-500/10",
			border: "border-green-500/20",
			text: "text-green-700 dark:text-green-300",
		},
		failure: {
			bg: "bg-destructive/10",
			border: "border-destructive/20",
			text: "text-destructive",
		},
	};
	const c = colors[variant];
	return (
		<div className={`p-4 rounded-xl border ${c.bg} ${c.border}`}>
			<div className="flex items-start gap-3">
				<span className={c.text}>{icon}</span>
				<div>
					<p className={`font-semibold text-sm ${c.text}`}>{title}</p>
					<p className="text-xs text-muted-foreground mt-1">{description}</p>
				</div>
			</div>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DemoBankApiFlow() {
	return (
		<section className="space-y-6">
			<SectionHeader
				icon={<Code2 className="h-5 w-5" />}
				title="How VidosDemoBank Uses the Vidos Authorizer API"
				description="The banking flows (sign-up, sign-in, payments, loans) each trigger a PID credential verification via the Vidos Authorizer API. Here's exactly how that works."
			/>

			{/* Executive framing */}
			<div className="rounded-xl bg-primary/5 border border-primary/20 p-5 space-y-2">
				<div className="flex items-center gap-2">
					<Shield className="h-4 w-4 text-primary" />
					<p className="font-semibold text-sm text-primary">
						What gets verified
					</p>
				</div>
				<p className="text-sm text-foreground/80 leading-relaxed">
					VidosDemoBank requests your{" "}
					<strong>Person Identification Data (PID)</strong> credential — the
					foundational EU Digital Identity. The bank reads your name, birth
					date, and personal administrative number (used as a unique account ID)
					from the cryptographically signed credential. No passwords. No forms.
				</p>
			</div>

			{/* API flow steps */}
			<div className="rounded-xl border border-border/60 bg-background p-6 space-y-0">
				<p className="font-semibold text-sm mb-5">
					Authorization request lifecycle
				</p>

				<FlowStep
					number={1}
					icon={<Code2 className="h-4 w-4" />}
					title="Bank initiates a PID credential request"
					description="When you click Sign Up or Sign In, the bank server calls the Vidos Authorizer API to create an authorization request specifying the PID claims required."
					detail={
						<>
							<p className="mt-2 text-xs text-muted-foreground">
								Requested PID claims:
							</p>
							<PidClaimBadges />
							<EndpointBlock
								method="POST"
								path="/openid4/vp/v1_0/authorizations"
								returns="authorizationId · authorizeUrl · nonce · expiresAt"
							/>
						</>
					}
				/>

				<FlowStep
					number={2}
					icon={<Smartphone className="h-4 w-4" />}
					title="QR code or deep link is shown"
					description="The authorizeUrl is rendered as a QR code on desktop. On mobile, a deep link is available. Your EUDI Wallet scans or follows the link and asks for consent to share the requested PID attributes."
				/>

				<FlowStep
					number={3}
					icon={<RefreshCw className="h-4 w-4" />}
					title="Bank listens for status via SSE"
					description="VidosDemoBank subscribes to a Server-Sent Events stream for real-time authorization status updates. The stream delivers terminal events as they happen — no polling loop."
					detail={
						<>
							<EndpointBlock
								method="GET"
								path="/openid4/vp/v1_0/authorizations/{authorizationId}/status"
							/>
							<p className="mt-2 text-xs text-muted-foreground">
								Possible terminal states:
							</p>
							<StatusBadgeRow />
						</>
					}
				/>

				<FlowStep
					number={4}
					icon={<FileSearch className="h-4 w-4" />}
					title="Policy response & credentials retrieved"
					description="On authorization, the bank fetches the policy response (cryptographic validity, issuer trust, integrity checks) and the disclosed PID claims."
					detail={
						<>
							<EndpointBlock
								method="GET"
								path="/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response"
								returns="overallStatus · checks[]"
							/>
							<EndpointBlock
								method="GET"
								path="/openid4/vp/v1_0/authorizations/{authorizationId}/credentials"
								returns="PID claims (name, birth_date, personal_administrative_number, …)"
							/>
						</>
					}
				/>

				<FlowStep
					number={5}
					icon={<Zap className="h-4 w-4" />}
					title="Business outcome driven by verified claims"
					description="The bank uses the verified claims to complete the banking action: create an account, authenticate the session, authorize a payment, or approve a loan. No personal data is stored in the Authorizer — only what the bank needs for its own records."
					isLast
				/>
			</div>

			{/* Possible outcomes */}
			<div className="space-y-3">
				<p className="font-semibold text-sm">Authorization outcomes</p>
				<div className="grid sm:grid-cols-2 gap-3">
					<OutcomeCard
						icon={<CheckCircle2 className="h-5 w-5" />}
						title="Authorized"
						description="Wallet presented a valid PID. Bank proceeds with the banking flow and creates/continues the session."
						variant="success"
					/>
					<OutcomeCard
						icon={<XCircle className="h-5 w-5" />}
						title="Rejected or Expired"
						description="User declined in wallet, or the request timed out. The bank shows an appropriate error and the user can retry."
						variant="failure"
					/>
				</div>
			</div>
		</section>
	);
}
