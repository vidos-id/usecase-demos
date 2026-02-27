import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Lock, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { ConfirmationBookingSummary } from "@/components/confirmation/confirmation-booking-summary";
import { ConfirmationCredentialHighlights } from "@/components/confirmation/confirmation-credential-highlights";
import { ConfirmationSelfPickup } from "@/components/confirmation/confirmation-self-pickup";
import { ConfirmationSuccessBanner } from "@/components/confirmation/confirmation-success-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VerifyStepBreadcrumb } from "@/components/verification/verify-step-breadcrumb";
import { createPricingSummary } from "@/domain/booking/booking-pricing";
import { useBookingStore } from "@/domain/booking/booking-store";
import { useDemoReset } from "@/domain/reset/use-demo-reset";
import { useVerificationStore } from "@/domain/verification/verification-store";

export const Route = createFileRoute("/confirmation")({
	component: ConfirmationPage,
});

function ConfirmationPage() {
	const navigate = useNavigate();
	const [handoffError, setHandoffError] = useState<string | null>(null);
	const { state: bookingState, handoffToCompletion } = useBookingStore();
	const { state: verificationState } = useVerificationStore();
	const resetDemo = useDemoReset();

	const requiresPaymentConfirmation =
		bookingState.status === "payment_confirmed" ||
		bookingState.status === "completed";

	useEffect(() => {
		if (
			bookingState.status !== "payment_confirmed" ||
			bookingState.confirmation
		) {
			return;
		}

		const result = handoffToCompletion(verificationState);
		if (!result.ok) {
			setHandoffError(result.error);
			return;
		}

		setHandoffError(null);
	}, [
		bookingState.status,
		bookingState.confirmation,
		handoffToCompletion,
		verificationState,
	]);

	if (!requiresPaymentConfirmation) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
				<Card className="w-full max-w-md border-border/60">
					<CardContent className="p-8 text-center">
						<Lock className="mx-auto mb-3 size-10 text-muted-foreground/40" />
						<h2 className="font-heading mb-2 text-lg font-bold">
							Payment Confirmation Required
						</h2>
						<p className="mb-5 text-sm text-muted-foreground">
							Complete mocked payment before opening final confirmation.
						</p>
						<Button
							className="rounded-xl"
							onClick={() => navigate({ to: "/payment" })}
						>
							Go to Payment
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const confirmation = bookingState.confirmation;
	const pricing = createPricingSummary(bookingState.rentalDetails);

	if (!confirmation) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background px-4">
				<Card className="w-full max-w-md border-border/60">
					<CardContent className="p-8 text-center">
						<h2 className="font-heading mb-2 text-lg font-bold">
							Finalizing booking
						</h2>
						<p className="text-sm text-muted-foreground">
							Preparing pickup details and credential highlights...
						</p>
						{handoffError && (
							<p className="mt-3 text-xs text-destructive">{handoffError}</p>
						)}
					</CardContent>
				</Card>
			</div>
		);
	}

	const handleStartOver = () => {
		resetDemo();
		navigate({ to: "/" });
	};

	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="min-h-screen bg-background">
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
					<VerifyStepBreadcrumb active="confirmation" />
				</div>
			</header>

			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
				<div className="mx-auto w-full max-w-4xl">
					{/* Success + eligibility */}
					<ConfirmationSuccessBanner
						eligibilityStatement={confirmation.eligibilityStatement}
					/>

					{/* Booking + Pickup side-by-side on lg */}
					<div className="mb-5 grid gap-5 lg:grid-cols-2">
						<ConfirmationBookingSummary
							bookingReference={confirmation.bookingReference}
							rentalDetails={bookingState.rentalDetails}
							pricing={pricing}
						/>
						<ConfirmationSelfPickup pickup={confirmation.pickup} />
					</div>

					{/* Credential highlights full-width */}
					<ConfirmationCredentialHighlights
						highlights={confirmation.credentialHighlights}
					/>

					{/* Start over */}
					<div className="mt-8 space-y-3">
						<Button
							variant="outline"
							className="w-full rounded-xl"
							onClick={handlePrint}
						>
							<Printer className="size-4" />
							Print Confirmation
						</Button>
						<Button
							className="w-full rounded-xl"
							onClick={handleStartOver}
							style={{
								background: "var(--amber)",
								color: "var(--amber-foreground)",
							}}
						>
							Start New Booking
							<ChevronRight className="size-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
