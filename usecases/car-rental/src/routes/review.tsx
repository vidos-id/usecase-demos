import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ChevronRight,
	CreditCard,
	FileCheck2,
	Shield,
	Smartphone,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VerifyStepBreadcrumb } from "@/components/verification/verify-step-breadcrumb";
import { useBookingStore } from "@/domain/booking/booking-store";
import { useVerificationStore } from "@/domain/verification/verification-store";

export const Route = createFileRoute("/review")({
	component: ReviewPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDays(pickup: string | null, dropoff: string | null): number {
	if (!pickup || !dropoff) return 0;
	const p = new Date(pickup);
	const d = new Date(dropoff);
	if (Number.isNaN(p.getTime()) || Number.isNaN(d.getTime())) return 0;
	return Math.max(1, Math.round((d.getTime() - p.getTime()) / 86400000));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ReviewPage() {
	const navigate = useNavigate();
	const { state, handoffToVerification, missingForVerification, rewindToStep } =
		useBookingStore();
	const { resetVerification } = useVerificationStore();
	const [validationError, setValidationError] = useState<string | null>(null);

	const { rentalDetails } = state;
	const { selectedVehicle, pickupDateTime, dropoffDateTime } = rentalDetails;

	const days = calcDays(pickupDateTime, dropoffDateTime);
	const subtotal = selectedVehicle ? selectedVehicle.pricePerDay * days : 0;
	const taxes = Math.round(subtotal * 0.19);
	const total = subtotal + taxes;

	const isComplete = missingForVerification.length === 0;
	const licenceCat = selectedVehicle?.requiredLicenceCategory ?? "B";

	const handleContinue = () => {
		const result = handoffToVerification();
		if (!result.ok) {
			setValidationError(result.error);
			return;
		}
		setValidationError(null);
		navigate({ to: "/verify" });
	};

	const handleBack = () => {
		rewindToStep("select");
		resetVerification();
		navigate({ to: "/search" });
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
						<img src="/vidos-drive-logo.svg" alt="VidosDrive" className="h-8" />
					</Link>
					<VerifyStepBreadcrumb active="review" />
				</div>
			</header>

			{/* Content */}
			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
				<div className="mx-auto w-full max-w-2xl">
					{/* Hero — driving licence required */}
					<div className="mb-8 text-center">
						<div
							className="mx-auto mb-5 flex size-20 items-center justify-center rounded-2xl"
							style={{ background: "oklch(0.42 0.10 220 / 0.10)" }}
						>
							<Shield className="size-10" style={{ color: "var(--primary)" }} />
						</div>
						<h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
							Driving Licence Verification Required
						</h1>
						<p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
							The selected vehicle requires a valid{" "}
							<strong className="text-foreground">
								Category {licenceCat} driving licence
							</strong>
							. You will need to present your{" "}
							<strong className="text-foreground">
								Mobile Driving Licence (mDL)
							</strong>{" "}
							from your EU Digital Identity Wallet so we can verify your driving
							privileges and licence validity.
						</p>
					</div>

					{/* Selected vehicle context — real car image */}
					{selectedVehicle && (
						<Card className="mb-6 overflow-hidden border-border/60">
							<CardContent className="p-0">
								{/* Car image */}
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
								{/* Vehicle info row */}
								<div className="flex items-center gap-4 p-5">
									<div className="flex-1 min-w-0">
										<p className="font-heading font-bold text-base">
											{selectedVehicle.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{selectedVehicle.category} &middot; €
											{selectedVehicle.pricePerDay}/day &middot; €{total} total
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

					{/* Requested claims */}
					<Card className="mb-6 border-border/60">
						<CardContent className="p-5">
							<h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
								Information requested from your mDL
							</h2>
							<p className="mb-4 text-xs text-muted-foreground">
								The following attributes will be requested from your Mobile
								Driving Licence to verify your eligibility:
							</p>
							<div className="grid grid-cols-2 gap-2">
								{[
									{ label: "Full name", detail: "given_name, family_name" },
									{ label: "Date of birth", detail: "birth_date" },
									{ label: "Document number", detail: "document_number" },
									{ label: "Expiry date", detail: "expiry_date" },
									{
										label: "Driving privileges",
										detail: `vehicle categories incl. ${licenceCat}`,
									},
									{ label: "Portrait photo", detail: "optional" },
								].map((item) => (
									<div
										key={item.label}
										className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
									>
										<p className="text-xs font-medium">{item.label}</p>
										<p className="text-[10px] text-muted-foreground">
											{item.detail}
										</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* What happens next */}
					<Card className="mb-6 border-border/60">
						<CardContent className="p-5">
							<h2 className="mb-4 font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
								What happens next
							</h2>
							<div className="space-y-4">
								<div className="flex items-start gap-3">
									<div
										className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
										style={{
											background: "var(--amber)",
											color: "var(--amber-foreground)",
										}}
									>
										1
									</div>
									<div>
										<p className="text-sm font-semibold">
											Scan QR with your wallet
										</p>
										<p className="text-xs text-muted-foreground">
											A QR code will appear. Open your EU Digital Identity
											Wallet app and scan it to initiate the mDL presentation.
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<div
										className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
										style={{
											background: "var(--amber)",
											color: "var(--amber-foreground)",
										}}
									>
										2
									</div>
									<div>
										<p className="text-sm font-semibold">
											Approve mDL disclosure
										</p>
										<p className="text-xs text-muted-foreground">
											Your wallet will show the requested attributes. Review
											them and approve the disclosure. We will check that your
											driving privileges include Category {licenceCat} and that
											your licence has not expired.
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<div
										className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
										style={{
											background: "var(--amber)",
											color: "var(--amber-foreground)",
										}}
									>
										3
									</div>
									<div>
										<p className="text-sm font-semibold">
											Eligibility confirmed, proceed to payment
										</p>
										<p className="text-xs text-muted-foreground">
											Once your Category {licenceCat} privilege is confirmed and
											the licence is valid, you will proceed to payment to
											finalize the booking.
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Technical note */}
					<div
						className="mb-6 rounded-xl border border-border/50 p-4"
						style={{ background: "oklch(0.42 0.10 220 / 0.06)" }}
					>
						<div className="flex items-start gap-3">
							<FileCheck2
								className="mt-0.5 size-4 shrink-0"
								style={{ color: "var(--primary)" }}
							/>
							<div className="text-xs leading-relaxed text-muted-foreground">
								<p>
									Your{" "}
									<strong className="text-foreground">
										ISO 18013-5 Mobile Driving Licence
									</strong>{" "}
									will be verified through the Vidos authorizer service. We
									request your driving privileges (including vehicle category
									codes) and licence expiry date to confirm eligibility. No
									unnecessary personal data is collected.
								</p>
							</div>
						</div>
					</div>

					{/* Missing fields */}
					{!isComplete && (
						<div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
							<div className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
								<AlertCircle className="size-4 shrink-0" />
								<span>Missing booking information</span>
							</div>
							<p className="text-xs text-destructive/80">
								Please go back and complete your car selection before verifying
								your licence.
							</p>
						</div>
					)}

					{/* Validation error */}
					{validationError && (
						<div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
							{validationError}
						</div>
					)}

					{/* CTA */}
					<Button
						className="w-full rounded-xl py-6 text-base font-bold"
						disabled={!isComplete}
						onClick={handleContinue}
						style={
							isComplete
								? {
										background: "var(--amber)",
										color: "var(--amber-foreground)",
									}
								: undefined
						}
					>
						{isComplete ? (
							<>
								<Smartphone className="size-5" />
								Present Mobile Driving Licence
								<ChevronRight className="size-5" />
							</>
						) : (
							<>
								<AlertCircle className="size-5" />
								Complete Booking First
							</>
						)}
					</Button>

					{/* Pricing footnote */}
					{selectedVehicle && (
						<div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
							<span className="flex items-center gap-1">
								<CreditCard className="size-3" />€{subtotal} + €{taxes} tax =
								<strong className="text-foreground"> €{total}</strong>
							</span>
							<Separator orientation="vertical" className="h-3" />
							<span>
								{days} day{days === 1 ? "" : "s"}
							</span>
						</div>
					)}

					{/* Back */}
					<div className="mt-6 text-center">
						<button
							type="button"
							onClick={handleBack}
							className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline"
						>
							← Back to Car Selection
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
