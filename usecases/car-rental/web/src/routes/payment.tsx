import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Lock } from "lucide-react";
import { useState } from "react";
import { PaymentCardDisplay } from "@/components/payment/payment-card-display";
import { PaymentOrderSummary } from "@/components/payment/payment-order-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationDisclosedClaimsPanel } from "@/components/verification/verification-disclosed-claims-panel";
import { VerifyStepBreadcrumb } from "@/components/verification/verify-step-breadcrumb";
import { createPricingSummary } from "@/domain/booking/booking-pricing";
import { useBookingStore } from "@/domain/booking/booking-store";
import { useDemoReset } from "@/domain/reset/use-demo-reset";
import { useVerificationStore } from "@/domain/verification/verification-store";

export const Route = createFileRoute("/payment")({
	component: PaymentPage,
});

// ─── Page ──────────────────────────────────────────────────────────────────────

function PaymentPage() {
	const navigate = useNavigate();
	const {
		state: bookingState,
		confirmMockPayment,
		rewindToStep,
	} = useBookingStore();
	const {
		canProceedToPayment,
		state: verificationState,
		resetVerification,
	} = useVerificationStore();
	const resetDemo = useDemoReset();
	const [paymentError, setPaymentError] = useState<string | null>(null);

	// Gate: if verification not complete, redirect back
	if (!canProceedToPayment) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
				<Card className="w-full max-w-md border-border/60">
					<CardContent className="p-8 text-center">
						<Lock className="mx-auto mb-3 size-10 text-muted-foreground/40" />
						<h2 className="font-heading mb-2 text-lg font-bold">
							Verification Required
						</h2>
						<p className="mb-5 text-sm text-muted-foreground">
							Identity verification must be completed before payment can
							proceed.
						</p>
						<Button
							className="rounded-xl"
							onClick={() => navigate({ to: "/verify" })}
						>
							Go to Verification
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { rentalDetails, bookingId } = bookingState;
	const pricing = createPricingSummary(rentalDetails);

	const handleConfirmPayment = () => {
		if (
			bookingState.status === "payment_confirmed" ||
			bookingState.status === "completed"
		) {
			navigate({ to: "/confirmation" });
			return;
		}

		const result = confirmMockPayment(verificationState);
		if (!result.ok) {
			setPaymentError(result.error);
			return;
		}

		setPaymentError(null);
		navigate({ to: "/confirmation" });
	};

	const handleStartOver = () => {
		resetDemo();
		navigate({ to: "/" });
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
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
					<VerifyStepBreadcrumb active="payment" />
				</div>
			</header>

			{/* Content */}
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
				<div className="mx-auto w-full max-w-2xl">
					{/* Verification passed banner */}
					<div
						className="mb-6 rounded-2xl border p-5"
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
									Your driving privileges and licence validity have been
									confirmed. Review the disclosed attributes below and complete
									checkout.
								</p>
							</div>
						</div>
					</div>

					<VerificationDisclosedClaimsPanel
						disclosedClaims={verificationState.disclosedClaims}
					/>

					{/* Order summary */}
					<Card className="my-5 border-border/60">
						<CardContent className="p-5">
							<PaymentOrderSummary
								bookingId={bookingId}
								rentalDetails={rentalDetails}
								pricing={pricing}
							/>
						</CardContent>
					</Card>

					{/* Read-only card details */}
					<PaymentCardDisplay />

					{paymentError && (
						<div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
							{paymentError}
						</div>
					)}

					{/* CTA */}
					<Button
						className="w-full rounded-xl font-semibold"
						style={{
							background: "var(--amber)",
							color: "var(--amber-foreground)",
						}}
						onClick={handleConfirmPayment}
					>
						Confirm & Pay €{pricing.total}
						<ChevronRight className="size-4" />
					</Button>

					{/* Back to verify / start over */}
					<div className="mt-6 flex flex-col items-center gap-3">
						<button
							type="button"
							onClick={() => {
								rewindToStep("verify");
								resetVerification();
								navigate({ to: "/verify" });
							}}
							className="text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline"
						>
							← Back to licence verification
						</button>
						<button
							type="button"
							onClick={handleStartOver}
							className="text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline"
						>
							Start a new booking
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
