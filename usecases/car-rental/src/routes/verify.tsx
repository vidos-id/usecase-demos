import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertTriangle,
	CheckCircle2,
	ClipboardList,
	Shield,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationBlockedPanel } from "@/components/verification/verification-blocked-panel";
import { VerificationDisclosedClaimsPanel } from "@/components/verification/verification-disclosed-claims-panel";
import { VerificationLifecycleBadge } from "@/components/verification/verification-lifecycle-badge";
import { VerificationPaymentGate } from "@/components/verification/verification-payment-gate";
import { VerificationQrPanel } from "@/components/verification/verification-qr-panel";
import { VerifyStepBreadcrumb } from "@/components/verification/verify-step-breadcrumb";
import { useBookingStore } from "@/domain/booking/booking-store";
import { useDemoReset } from "@/domain/reset/use-demo-reset";
import { checkLicenceCompatibility } from "@/domain/verification/licence-check";
import { useVerificationStore } from "@/domain/verification/verification-store";

export const Route = createFileRoute("/verify")({
	component: VerifyPage,
});

// ─── Guard ─────────────────────────────────────────────────────────────────────

function NoBookingGuard() {
	const navigate = useNavigate();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
			<Card className="w-full max-w-md border-border/60">
				<CardContent className="p-8 text-center">
					<ClipboardList className="mx-auto mb-3 size-10 text-muted-foreground/40" />
					<h2 className="font-heading mb-2 text-lg font-bold">
						No active booking
					</h2>
					<p className="mb-5 text-sm text-muted-foreground">
						Select a car and proceed to licence verification first.
					</p>
					<Button className="rounded-xl" onClick={() => navigate({ to: "/" })}>
						Start a new booking
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Processing panel ──────────────────────────────────────────────────────────

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
					Checking your driving privileges and licence validity...
				</p>
			</CardContent>
		</Card>
	);
}

// ─── Success banner ────────────────────────────────────────────────────────────

function SuccessBanner({
	licenceCat,
	categories,
}: {
	licenceCat: string;
	categories: string[];
}) {
	const categoriesLabel =
		categories.length > 0 ? categories.join(", ") : "Not disclosed";

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
						Driving Licence Verified
					</h2>
					<p className="text-sm text-muted-foreground">
						Your mDL was accepted. Category {licenceCat} privilege confirmed
						(disclosed categories: {categoriesLabel}). Licence is valid and not
						expired.
					</p>
				</div>
			</div>
		</div>
	);
}

// ─── Category mismatch warning ─────────────────────────────────────────────────

function CategoryMismatchRejection({
	required,
	presented,
}: {
	required: string;
	presented: string[];
}) {
	const presentedLabel = presented.length > 0 ? presented.join(", ") : "none";

	return (
		<div
			className="mb-5 animate-slide-down rounded-2xl border p-5"
			style={{
				borderColor: "oklch(0.55 0.22 25 / 0.4)",
				background: "oklch(0.55 0.22 25 / 0.06)",
			}}
		>
			<div className="flex items-start gap-3">
				<AlertTriangle
					className="mt-0.5 size-5 shrink-0"
					style={{ color: "oklch(0.55 0.22 25)" }}
				/>
				<div className="space-y-3">
					<div>
						<h2
							className="font-heading mb-1 font-bold"
							style={{ color: "oklch(0.45 0.22 25)" }}
						>
							Rental Rejected - Licence Category Mismatch
						</h2>
						<p className="text-sm text-muted-foreground">
							The selected vehicle requires a driving licence category that was
							not found in your presented credentials. This booking cannot
							proceed.
						</p>
					</div>

					<div
						className="rounded-lg p-3 text-sm"
						style={{ background: "oklch(0.55 0.22 25 / 0.06)" }}
					>
						<div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
							<span className="font-medium text-muted-foreground">
								Required:
							</span>
							<span
								className="font-bold"
								style={{ color: "oklch(0.45 0.22 25)" }}
							>
								Category {required}
							</span>
							<span className="font-medium text-muted-foreground">
								Received:
							</span>
							<span className="font-bold">
								{presented.length > 0
									? `Category ${presentedLabel}`
									: "No categories disclosed"}
							</span>
						</div>
					</div>

					<p className="text-xs text-muted-foreground">
						Please start a new booking and select a vehicle that matches your
						licence category, or present a licence with Category {required}{" "}
						privileges.
					</p>
				</div>
			</div>
		</div>
	);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function VerifyPage() {
	const navigate = useNavigate();
	const { state: bookingState } = useBookingStore();
	const {
		state: verificationState,
		canProceedToPayment,
		startVerification,
		refreshLiveStatus,
		retryVerification,
	} = useVerificationStore();
	const resetDemo = useDemoReset();

	const { status, bookingId } = bookingState;
	const isHandedOff =
		status === "awaiting_verification" ||
		status === "verified" ||
		status === "payment_confirmed" ||
		status === "completed";

	// Auto-start verification when we arrive in awaiting_verification with no active session
	useEffect(() => {
		if (
			isHandedOff &&
			bookingId &&
			verificationState.lifecycle === "created" &&
			verificationState.bookingId === null
		) {
			void startVerification(bookingState);
		}
	}, [
		isHandedOff,
		bookingId,
		verificationState.lifecycle,
		verificationState.bookingId,
		bookingState,
		startVerification,
	]);

	const {
		lifecycle,
		authorizerId,
		authorizationUrl,
		request,
		lastError,
		disclosedClaims,
	} = verificationState;

	const selectedVehicle = bookingState.rentalDetails.selectedVehicle;
	const licenceCat = selectedVehicle?.requiredLicenceCategory ?? "B";

	const licenceCheck = useMemo(
		() => checkLicenceCompatibility(disclosedClaims, licenceCat),
		[disclosedClaims, licenceCat],
	);

	// Client-side gate: authorizer success AND licence category match
	const canActuallyProceed = canProceedToPayment && licenceCheck.eligible;

	useEffect(() => {
		if (!isHandedOff || !bookingId) return;
		if (!authorizerId) return;
		if (lifecycle !== "pending_wallet" && lifecycle !== "processing") return;

		const pollTimer = window.setInterval(() => {
			void refreshLiveStatus();
		}, 1000);

		return () => {
			window.clearInterval(pollTimer);
		};
	}, [authorizerId, bookingId, isHandedOff, lifecycle, refreshLiveStatus]);

	useEffect(() => {
		if (!isHandedOff || !bookingId) return;
		if (!canActuallyProceed) return;
		navigate({ to: "/payment" });
	}, [bookingId, canActuallyProceed, isHandedOff, navigate]);

	if (!isHandedOff || !bookingId) {
		return <NoBookingGuard />;
	}

	const isBlocked =
		lifecycle === "rejected" ||
		lifecycle === "expired" ||
		lifecycle === "error";

	const isSuccess = lifecycle === "success";
	const isProcessing = lifecycle === "processing";

	const handleRetry = () => {
		void retryVerification(bookingState);
	};

	const handleContinueToPayment = () => {
		navigate({ to: "/payment" });
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header — identical to review page */}
			<header
				className="glass sticky top-0 z-50 border-b border-border/50 bg-background/80"
				style={{ backdropFilter: "blur(8px)" }}
			>
				<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
					<Link to="/">
						<img
							src="/car-rental/vidos-drive-logo.svg"
							alt="VidosDrive"
							className="h-8"
						/>
					</Link>
					<VerifyStepBreadcrumb active="verify" />
				</div>
			</header>

			{/* Content — same max-w-2xl centered column as review page */}
			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
				<div className="mx-auto w-full max-w-2xl">
					{/* Hero — consistent with review page */}
					<div className="mb-8 text-center">
						<div
							className="mx-auto mb-5 flex size-20 items-center justify-center rounded-2xl"
							style={{ background: "oklch(0.42 0.10 220 / 0.10)" }}
						>
							<Shield className="size-10" style={{ color: "var(--primary)" }} />
						</div>
						<div className="flex items-center justify-center gap-2">
							<h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
								Present Your Driving Licence
							</h1>
						</div>
						<p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
							Scan the QR code below with your{" "}
							<strong className="text-foreground">
								EU Digital Identity Wallet
							</strong>{" "}
							to present your mDL. We will verify your Category {licenceCat}{" "}
							driving privileges and licence expiry date.
						</p>
						<div className="mt-3 flex justify-center">
							<VerificationLifecycleBadge lifecycle={lifecycle} />
						</div>
					</div>

					{/* Vehicle context — real car image, same as review page */}
					{selectedVehicle && (
						<Card className="mb-6 overflow-hidden border-border/60">
							<CardContent className="p-0">
								<div
									className="flex h-44 items-center justify-center overflow-hidden sm:h-52"
									style={{ background: "var(--muted)" }}
								>
									<img
										src={selectedVehicle.imageUrl}
										alt={selectedVehicle.name}
										className="h-full w-full object-contain p-4"
									/>
								</div>
								<div className="flex items-center gap-4 p-5">
									<div className="flex-1 min-w-0">
										<p className="font-heading font-bold text-base">
											{selectedVehicle.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{selectedVehicle.category} &middot; €
											{selectedVehicle.pricePerDay}/day
										</p>
									</div>
									<div
										className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold"
										style={{
											background: "oklch(0.42 0.10 220 / 0.10)",
											color: "var(--primary)",
										}}
									>
										Requires Category {licenceCat}
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Success banner with licence check */}
					{isSuccess && licenceCheck.categoryMatch && (
						<SuccessBanner
							licenceCat={licenceCat}
							categories={licenceCheck.presentedCategories}
						/>
					)}

					{/* Category mismatch rejection */}
					{isSuccess && !licenceCheck.categoryMatch && (
						<CategoryMismatchRejection
							required={licenceCat}
							presented={licenceCheck.presentedCategories}
						/>
					)}

					{/* Processing spinner */}
					{isProcessing && <ProcessingPanel />}

					{/* Blocked panel (rejected / expired / error) */}
					{isBlocked && (
						<VerificationBlockedPanel
							lifecycle={lifecycle}
							lastError={lastError}
							onRetry={handleRetry}
							onReset={() => {
								resetDemo();
								navigate({ to: "/" });
							}}
						/>
					)}

					{/* QR / wallet pending panel */}
					<VerificationQrPanel
						lifecycle={lifecycle}
						requestId={request?.requestId ?? null}
						authorizationUrl={authorizationUrl}
					/>

					{/* Disclosed claims */}
					{isSuccess && disclosedClaims && (
						<VerificationDisclosedClaimsPanel
							disclosedClaims={disclosedClaims}
						/>
					)}

					{/* Payment gate */}
					<VerificationPaymentGate
						canProceed={canActuallyProceed}
						onContinue={handleContinueToPayment}
						rejectionReason={
							canProceedToPayment && !licenceCheck.eligible
								? `Licence category mismatch: requires Category ${licenceCat}, received ${licenceCheck.presentedCategories.length > 0 ? `Category ${licenceCheck.presentedCategories.join(", ")}` : "none"}.`
								: undefined
						}
					/>

					{/* Start over */}
					<div className="mt-6 text-center">
						<button
							type="button"
							onClick={() => {
								resetDemo();
								navigate({ to: "/" });
							}}
							className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline"
						>
							Start a new booking
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
