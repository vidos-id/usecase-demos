import { useNavigate } from "@tanstack/react-router";
import { useBookingStore } from "@/domain/booking/booking-store";
import { useVerificationStore } from "@/domain/verification/verification-store";
import { cn } from "@/lib/utils";

type Step = "search" | "select" | "verify" | "payment" | "confirmation";

type Props = {
	/** The active breadcrumb step. "review" is treated as "verify". */
	active: Step | "review";
};

const STEPS: { key: Step; label: string }[] = [
	{ key: "search", label: "1. Search" },
	{ key: "select", label: "2. Select Car" },
	{ key: "verify", label: "3. Verify Licence" },
	{ key: "payment", label: "4. Payment" },
	{ key: "confirmation", label: "5. Confirmation" },
];

const STEP_ROUTES: Record<Step, string> = {
	search: "/",
	select: "/search",
	verify: "/review",
	payment: "/payment",
	confirmation: "/confirmation",
};

export function VerifyStepBreadcrumb({ active }: Props) {
	const navigate = useNavigate();
	const { state: bookingState, rewindToStep } = useBookingStore();
	const { state: verificationState, resetVerification } =
		useVerificationStore();

	// Normalize "review" to "verify" so both /review and /verify highlight the same step
	const normalizedActive: Step = active === "review" ? "verify" : active;

	const canGoVerify =
		Boolean(bookingState.rentalDetails.selectedVehicle) ||
		bookingState.status === "awaiting_verification" ||
		bookingState.status === "verified" ||
		bookingState.status === "payment_confirmed" ||
		bookingState.status === "completed" ||
		verificationState.bookingId !== null;
	const canGoPayment =
		verificationState.lifecycle === "success" ||
		bookingState.status === "payment_confirmed" ||
		bookingState.status === "completed";
	const canGoConfirmation =
		bookingState.status === "payment_confirmed" ||
		bookingState.status === "completed";

	const enabledSteps: Record<Step, boolean> = {
		search: true,
		select: true,
		verify: canGoVerify,
		payment: canGoPayment,
		confirmation: canGoConfirmation,
	};

	return (
		<div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
			{STEPS.map((step, i) => (
				<span key={step.key} className="flex items-center gap-2">
					{i > 0 && (
						<svg
							className="size-3"
							viewBox="0 0 12 12"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M4 2l4 4-4 4"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					)}
					<button
						type="button"
						onClick={() => {
							if (!enabledSteps[step.key] || step.key === normalizedActive) {
								return;
							}

							if (step.key === "search") {
								rewindToStep("search");
								resetVerification();
							} else if (step.key === "select") {
								rewindToStep("select");
								resetVerification();
							} else if (step.key === "verify") {
								rewindToStep("review");
								resetVerification();
							}

							navigate({ to: STEP_ROUTES[step.key] });
						}}
						disabled={!enabledSteps[step.key]}
						className={cn(
							"transition-colors",
							step.key === normalizedActive
								? "font-semibold"
								: enabledSteps[step.key]
									? "cursor-pointer hover:text-foreground"
									: "cursor-not-allowed text-muted-foreground/50",
						)}
						style={
							step.key === normalizedActive
								? { color: "var(--primary)" }
								: undefined
						}
					>
						{step.label}
					</button>
				</span>
			))}
		</div>
	);
}
