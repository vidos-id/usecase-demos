import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Prefilled, read-only card display for mock payment. */
const MOCK_CARD = {
	cardholder: "Emma Schneider",
	number: "**** **** **** 1024",
	expiry: "12 / 30",
	cvv: "•••",
	network: "VISA",
} as const;

type FieldProps = {
	label: string;
	value: string;
	mono?: boolean;
};

function ReadOnlyField({ label, value, mono }: FieldProps) {
	return (
		<div className="flex items-center justify-between gap-4 py-2.5">
			<span className="text-sm text-muted-foreground">{label}</span>
			<span
				className={[
					"text-sm font-medium",
					mono ? "font-mono tracking-wider" : "",
				].join(" ")}
			>
				{value}
			</span>
		</div>
	);
}

export function PaymentCardDisplay() {
	return (
		<Card className="mb-5 border-border/60">
			<CardContent className="p-5">
				<div className="mb-3 flex items-center justify-between">
					<h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
						Payment Details
					</h3>
					<div className="flex items-center gap-1.5">
						<Lock
							className="size-3 text-muted-foreground/60"
							aria-hidden="true"
						/>
						<span className="text-xs text-muted-foreground/60">
							{MOCK_CARD.network}
						</span>
					</div>
				</div>

				{/* Card face hint */}
				<div
					className="mb-4 rounded-xl px-4 py-3"
					style={{
						background:
							"linear-gradient(135deg, oklch(0.42 0.1 220) 0%, oklch(0.35 0.12 240) 100%)",
					}}
				>
					<p
						className="font-mono mb-3 text-base tracking-[0.2em]"
						style={{ color: "oklch(0.99 0 0 / 0.9)" }}
					>
						{MOCK_CARD.number}
					</p>
					<div className="flex items-end justify-between">
						<div>
							<p
								className="mb-0.5 text-[10px] uppercase tracking-widest"
								style={{ color: "oklch(0.85 0 0 / 0.6)" }}
							>
								Cardholder
							</p>
							<p
								className="font-heading text-sm font-semibold"
								style={{ color: "oklch(0.99 0 0)" }}
							>
								{MOCK_CARD.cardholder}
							</p>
						</div>
						<div className="text-right">
							<p
								className="mb-0.5 text-[10px] uppercase tracking-widest"
								style={{ color: "oklch(0.85 0 0 / 0.6)" }}
							>
								Expires
							</p>
							<p
								className="font-mono text-sm font-semibold"
								style={{ color: "oklch(0.99 0 0)" }}
							>
								{MOCK_CARD.expiry}
							</p>
						</div>
					</div>
				</div>

				{/* Read-only fields */}
				<div className="divide-y divide-border/60 rounded-xl border border-border/50 bg-muted/20 px-4">
					<ReadOnlyField label="Cardholder" value={MOCK_CARD.cardholder} />
					<ReadOnlyField label="Card number" value={MOCK_CARD.number} mono />
					<ReadOnlyField label="Expiry" value={MOCK_CARD.expiry} mono />
					<ReadOnlyField label="Security code" value={MOCK_CARD.cvv} mono />
				</div>
			</CardContent>
		</Card>
	);
}
