import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertTriangle,
	CheckCircle2,
	RefreshCw,
	Shield,
	ShoppingCart,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrderStore } from "@/domain/order/order-store";
import { useDemoReset } from "@/domain/reset/use-demo-reset";
import { getAgeMethodTechnicalDetails } from "@/domain/verification/age-verification-method-details";
import { useVerificationStore } from "@/domain/verification/verification-store";
import type { AgeVerificationMethod } from "@/domain/verification/verification-types";

export const Route = createFileRoute("/checkout")({
	component: CheckoutPage,
});

// ─── Processing spinner ─────────────────────────────────────────────────────────

function ProcessingPanel() {
	return (
		<Card className="mb-5 border-border/60">
			<CardContent className="p-6 text-center">
				<div className="mx-auto mb-4 flex size-16 items-center justify-center">
					<svg
						className="size-12 animate-spin"
						viewBox="0 0 48 48"
						fill="none"
						aria-hidden="true"
					>
						<circle
							cx="24"
							cy="24"
							r="20"
							stroke="currentColor"
							strokeWidth="3"
							strokeOpacity="0.15"
						/>
						<path
							d="M24 4a20 20 0 0 1 20 20"
							stroke="var(--primary)"
							strokeWidth="3"
							strokeLinecap="round"
						/>
					</svg>
				</div>
				<h3 className="font-heading mb-1 text-base font-bold">
					Evaluating Credentials
				</h3>
				<p className="text-sm text-muted-foreground">
					Verifying your identity and age eligibility...
				</p>
			</CardContent>
		</Card>
	);
}

// ─── Success banner ─────────────────────────────────────────────────────────────

function SuccessBanner({
	name,
	actualAge,
}: {
	name: string | null;
	actualAge: number | null;
}) {
	return (
		<div
			className="mb-5 animate-slide-down rounded-2xl border p-5"
			style={{
				borderColor: "oklch(0.52 0.16 145 / 0.4)",
				background: "oklch(0.52 0.16 145 / 0.05)",
			}}
		>
			<div className="flex items-start gap-3">
				<CheckCircle2
					className="mt-0.5 size-5 shrink-0"
					style={{ color: "oklch(0.52 0.16 145)" }}
				/>
				<div>
					<h2
						className="font-heading mb-1 font-bold"
						style={{ color: "oklch(0.42 0.16 145)" }}
					>
						Age Verified — Purchase Approved
					</h2>
					<p className="text-sm text-muted-foreground">
						{name ? `${name}, your` : "Your"} identity was verified
						successfully.
						{actualAge !== null &&
							` Age confirmed: ${actualAge} years old. You may proceed to payment.`}
					</p>
				</div>
			</div>
		</div>
	);
}

// ─── Age restriction rejection ──────────────────────────────────────────────────

function AgeRejectionPanel({
	requiredAge,
	actualAge,
	destination,
}: {
	requiredAge: number;
	actualAge: number | null;
	destination: string;
}) {
	return (
		<div
			className="mb-5 animate-slide-down rounded-2xl border p-5"
			style={{
				borderColor: "oklch(0.6 0.18 40 / 0.5)",
				background: "oklch(0.6 0.18 40 / 0.07)",
			}}
		>
			<div className="flex items-start gap-3">
				<AlertTriangle
					className="mt-0.5 size-5 shrink-0"
					style={{ color: "oklch(0.55 0.2 40)" }}
				/>
				<div className="space-y-3">
					<div>
						<h2
							className="font-heading mb-1 font-bold"
							style={{ color: "oklch(0.45 0.2 40)" }}
						>
							Age Restriction — Purchase Blocked
						</h2>
						<p className="text-sm text-muted-foreground">
							Unfortunately, your verified age does not meet the legal drinking
							age requirement for delivery to{" "}
							<strong className="text-foreground">{destination}</strong>.
						</p>
					</div>

					<div
						className="rounded-lg p-3 text-sm"
						style={{ background: "oklch(0.6 0.18 40 / 0.08)" }}
					>
						<div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
							<span className="font-medium text-muted-foreground">
								Required age:
							</span>
							<span
								className="font-bold"
								style={{ color: "oklch(0.45 0.2 40)" }}
							>
								{requiredAge}+
							</span>
							<span className="font-medium text-muted-foreground">
								Your age:
							</span>
							<span className="font-bold">
								{actualAge !== null ? `${actualAge} years` : "Not disclosed"}
							</span>
							<span className="font-medium text-muted-foreground">
								Destination:
							</span>
							<span className="font-bold">{destination}</span>
						</div>
					</div>

					<p className="text-xs text-muted-foreground">
						To complete a purchase, please select a destination where you meet
						the legal drinking age, or use a wallet with a qualifying identity
						credential.
					</p>
				</div>
			</div>
		</div>
	);
}

// ─── Blocked panel ──────────────────────────────────────────────────────────────

function BlockedPanel({
	lifecycle,
	lastError,
	onRetry,
	onReset,
	canRetry,
}: {
	lifecycle: string;
	lastError: string | null;
	onRetry: () => void;
	onReset: () => void;
	canRetry: boolean;
}) {
	const labels: Record<string, { title: string; desc: string }> = {
		rejected: {
			title: "Verification Rejected",
			desc: "Your wallet presentation was rejected. You can try again.",
		},
		expired: {
			title: "Session Expired",
			desc: "The verification session expired. Please start again.",
		},
		error: {
			title: "Verification Error",
			desc:
				lastError ??
				"An unexpected error occurred during verification. Please try again.",
		},
	};
	const info = labels[lifecycle] ?? labels["error"];

	return (
		<Card className="mb-5 border-destructive/30">
			<CardContent className="p-6 text-center">
				<XCircle
					className="mx-auto mb-3 size-10"
					style={{ color: "var(--destructive)" }}
				/>
				<h3 className="font-heading mb-1 text-base font-bold">{info.title}</h3>
				<p className="mb-4 text-sm text-muted-foreground">{info.desc}</p>
				{lastError && lifecycle !== "error" && (
					<p className="mb-4 text-xs text-destructive">{lastError}</p>
				)}
				<div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
					{canRetry && (
						<Button
							size="sm"
							onClick={onRetry}
							className="gap-2 rounded-xl"
							style={{
								background: "var(--primary)",
								color: "var(--primary-foreground)",
							}}
						>
							<RefreshCw className="size-3.5" />
							Try Again
						</Button>
					)}
					<Button
						size="sm"
						variant="outline"
						onClick={onReset}
						className="rounded-xl"
					>
						Start Over
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function ClaimRequestPanel({
	requiredAge,
	ageVerificationMethod,
}: {
	requiredAge: number;
	ageVerificationMethod: AgeVerificationMethod | null;
}) {
	if (ageVerificationMethod === null) {
		return null;
	}

	const details = getAgeMethodTechnicalDetails(
		ageVerificationMethod,
		requiredAge,
	);

	return (
		<Card className="mb-5 border-border/60">
			<CardContent className="p-5">
				<h3 className="font-heading mb-2 text-sm font-bold">
					Requested PID Claim
				</h3>
				<div className="grid gap-2 text-xs text-muted-foreground">
					<p>
						Field: <code>{details.pidField}</code>
					</p>
					<p>
						Claim path sent to authorizer: <code>{details.claimPath}</code>
					</p>
					<p>
						Expected value type: <code>{details.valueShape}</code>
					</p>
					<p>
						Accepted when:{" "}
						<strong className="text-foreground">
							{details.acceptanceRule}
						</strong>
					</p>
					<p>
						Example accepted value: <code>{details.exampleAcceptedValue}</code>
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── QR panel ───────────────────────────────────────────────────────────────────

function QrPanel({
	authorizationUrl,
	lifecycle,
}: {
	authorizationUrl: string | null;
	lifecycle: string;
}) {
	const [qrLoaded, setQrLoaded] = useState(false);

	const showQr =
		lifecycle === "pending_wallet" ||
		lifecycle === "processing" ||
		lifecycle === "created";

	useEffect(() => {
		if (authorizationUrl) {
			setQrLoaded(false);
		}
	}, [authorizationUrl]);

	if (!showQr || !authorizationUrl) return null;

	const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(authorizationUrl)}`;

	return (
		<Card className="mb-5 border-border/60">
			<CardContent className="p-6">
				<div className="flex flex-col items-center gap-4">
					<div className="relative overflow-hidden rounded-lg border border-border/60 bg-card p-3 shadow-sm">
						<div
							className="absolute inset-0 opacity-50"
							style={{
								background:
									"linear-gradient(140deg, oklch(0.95 0.01 60) 0%, transparent 50%, oklch(0.92 0.02 25) 100%)",
							}}
						/>
						<img
							src={qrUrl}
							alt="Wallet authorization QR code"
							width={240}
							height={240}
							onLoad={() => setQrLoaded(true)}
							className="relative border border-border/60 bg-white"
						/>
						{(!qrLoaded || lifecycle === "processing") && (
							<div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-[2px]">
								<div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/90 px-4 py-3 shadow-sm">
									<svg
										className="size-8 animate-spin"
										viewBox="0 0 48 48"
										fill="none"
										aria-hidden="true"
									>
										<circle
											cx="24"
											cy="24"
											r="20"
											stroke="currentColor"
											strokeWidth="3"
											strokeOpacity="0.15"
										/>
										<path
											d="M24 4a20 20 0 0 1 20 20"
											stroke="var(--primary)"
											strokeWidth="3"
											strokeLinecap="round"
										/>
									</svg>
									<p className="text-xs font-medium text-muted-foreground">
										{qrLoaded
											? "Waiting for wallet response..."
											: "Loading QR code..."}
									</p>
								</div>
							</div>
						)}
					</div>

					<div className="text-center">
						<p className="mb-1 text-sm font-semibold">
							Scan with your EU Digital Identity Wallet
						</p>
						<p className="text-xs text-muted-foreground">
							Your wallet will request your PID credential to verify age
							eligibility
						</p>
					</div>

					<a
						href={authorizationUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-xs underline underline-offset-2"
						style={{ color: "var(--primary)" }}
					>
						Open wallet authorization link ↗
					</a>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Guard ──────────────────────────────────────────────────────────────────────

function NoOrderGuard() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
			<Card className="w-full max-w-md border-border/60">
				<CardContent className="p-8 text-center">
					<ShoppingCart className="mx-auto mb-3 size-10 text-muted-foreground/40" />
					<h2 className="font-heading mb-2 text-lg font-bold">
						No active order
					</h2>
					<p className="mb-5 text-sm text-muted-foreground">
						Add items to your cart and proceed to checkout first.
					</p>
					<Link to="/">
						<Button
							className="rounded-xl"
							style={{
								background: "var(--primary)",
								color: "var(--primary-foreground)",
							}}
						>
							Browse wines
						</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────────

function CheckoutPage() {
	const navigate = useNavigate();
	const { state: orderState } = useOrderStore();
	const {
		state: verificationState,
		canProceedToPayment,
		canRecoverFromFailure,
		startVerification,
		refreshLiveStatus,
		retryVerification,
	} = useVerificationStore();
	const resetDemo = useDemoReset();

	const { status, orderId, shippingDestination, ageVerificationMethod } =
		orderState;

	const isActive =
		status === "awaiting_verification" ||
		status === "verified" ||
		status === "payment_confirmed" ||
		status === "completed";

	const {
		lifecycle,
		authorizerId,
		authorizationUrl,
		disclosedClaims,
		ageCheck,
		lastError,
	} = verificationState;

	// Auto-start verification when we arrive with no active session
	useEffect(() => {
		if (
			isActive &&
			orderId &&
			shippingDestination &&
			ageVerificationMethod !== null &&
			lifecycle === "created" &&
			verificationState.orderId === null
		) {
			void startVerification({
				orderId,
				shippingDestination,
				ageVerificationMethod,
			});
		}
	}, [
		isActive,
		orderId,
		shippingDestination,
		ageVerificationMethod,
		lifecycle,
		verificationState.orderId,
		startVerification,
	]);

	// Poll status every 1s while pending or processing
	useEffect(() => {
		if (!isActive || !authorizerId || !shippingDestination) return;
		if (lifecycle !== "pending_wallet" && lifecycle !== "processing") return;

		const timer = window.setInterval(() => {
			void refreshLiveStatus(shippingDestination);
		}, 1000);

		return () => window.clearInterval(timer);
	}, [
		authorizerId,
		isActive,
		lifecycle,
		refreshLiveStatus,
		shippingDestination,
	]);

	// Auto-navigate to payment when eligible
	useEffect(() => {
		if (canProceedToPayment) {
			void navigate({ to: "/payment" });
		}
	}, [canProceedToPayment, navigate]);

	if (!isActive || !orderId || !shippingDestination) {
		return <NoOrderGuard />;
	}

	const isBlocked =
		lifecycle === "rejected" ||
		lifecycle === "expired" ||
		lifecycle === "error";
	const isSuccess = lifecycle === "success";
	const isProcessing = lifecycle === "processing";

	const ageCheckFailed = isSuccess && ageCheck !== null && !ageCheck.eligible;
	const ageCheckPassed = isSuccess && ageCheck !== null && ageCheck.eligible;

	const handleRetry = () => {
		if (orderId && shippingDestination && ageVerificationMethod !== null) {
			void retryVerification({
				orderId,
				shippingDestination,
				ageVerificationMethod,
			});
		}
	};

	const handleReset = () => {
		resetDemo();
		void navigate({ to: "/" });
	};

	const fullName =
		[disclosedClaims?.givenName, disclosedClaims?.familyName]
			.filter(Boolean)
			.join(" ") || null;

	return (
		<div className="min-h-screen bg-background">
			<Header>
				<div
					className="flex items-center gap-2 text-sm font-medium"
					style={{ color: "var(--primary)" }}
				>
					<Shield className="size-4" />
					Identity Verification
				</div>
			</Header>

			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
				<div className="mx-auto w-full max-w-2xl">
					{/* Hero */}
					<div className="mb-8 text-center">
						<div
							className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl"
							style={{ background: "oklch(0.4 0.12 15 / 0.1)" }}
						>
							<Shield className="size-8" style={{ color: "var(--primary)" }} />
						</div>
						<h1 className="font-heading mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
							Verify Your Age
						</h1>
						<p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
							Scan the QR code with your{" "}
							<strong className="text-foreground">
								EU Digital Identity Wallet
							</strong>{" "}
							to verify your age and identity. Shipping to{" "}
							<strong className="text-foreground">
								{shippingDestination.label}
							</strong>{" "}
							requires age {shippingDestination.legalDrinkingAge}+.
						</p>
					</div>

					<ClaimRequestPanel
						requiredAge={shippingDestination.legalDrinkingAge}
						ageVerificationMethod={ageVerificationMethod}
					/>

					{/* Processing panel */}
					{isProcessing && <ProcessingPanel />}

					{/* Blocked panel */}
					{isBlocked && (
						<BlockedPanel
							lifecycle={lifecycle}
							lastError={lastError}
							onRetry={handleRetry}
							onReset={handleReset}
							canRetry={canRecoverFromFailure}
						/>
					)}

					{/* Age restriction rejection */}
					{ageCheckFailed && ageCheck && (
						<AgeRejectionPanel
							requiredAge={ageCheck.requiredAge}
							actualAge={ageCheck.actualAge}
							destination={ageCheck.destination}
						/>
					)}

					{/* Success banner */}
					{ageCheckPassed && (
						<SuccessBanner
							name={fullName}
							actualAge={ageCheck?.actualAge ?? null}
						/>
					)}

					{/* QR panel */}
					<QrPanel authorizationUrl={authorizationUrl} lifecycle={lifecycle} />

					{/* Start over link */}
					<div className="mt-6 text-center">
						<button
							type="button"
							onClick={handleReset}
							className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline"
						>
							Start a new order
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
