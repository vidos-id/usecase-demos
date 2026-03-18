import { AlertTriangle, CheckCircle2, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
	canProceed: boolean;
	onContinue: () => void;
	/** When set, payment is blocked and this message explains why. */
	rejectionReason?: string;
};

export function VerificationPaymentGate({
	canProceed,
	onContinue,
	rejectionReason,
}: Props) {
	return (
		<Card className="border-border/60 mt-5">
			<CardContent className="p-5">
				{canProceed ? (
					<div>
						<div className="mb-3 flex items-center gap-2">
							<CheckCircle2
								className="size-4"
								style={{ color: "oklch(0.52 0.16 145)" }}
							/>
							<h3
								className="font-heading text-sm font-bold"
								style={{ color: "oklch(0.52 0.16 145)" }}
							>
								Driving Licence Verified
							</h3>
						</div>
						<p className="mb-4 text-sm text-muted-foreground">
							Your driving privileges and licence validity have been confirmed.
							Continue to payment to complete your booking.
						</p>
						<Button
							className="w-full rounded-xl font-semibold"
							onClick={onContinue}
							style={{
								background: "var(--amber)",
								color: "var(--amber-foreground)",
							}}
						>
							Continue to Payment
							<ChevronRight className="size-4" />
						</Button>
					</div>
				) : rejectionReason ? (
					<div className="flex items-start gap-3">
						<AlertTriangle
							className="mt-0.5 size-4 shrink-0"
							style={{ color: "oklch(0.55 0.22 25)" }}
						/>
						<div>
							<h3
								className="font-heading text-sm font-bold"
								style={{ color: "oklch(0.55 0.22 25)" }}
							>
								Payment Blocked
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								{rejectionReason}
							</p>
						</div>
					</div>
				) : (
					<div className="flex items-center gap-3 opacity-60">
						<Lock className="size-4 shrink-0 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							Payment is locked until your driving licence is verified.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
