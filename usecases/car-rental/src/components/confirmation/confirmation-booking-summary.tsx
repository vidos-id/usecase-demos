import { Calendar, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BookingConfirmationPayload } from "@/domain/booking/booking-confirmation";
import type { BookingPricingSummary } from "@/domain/booking/booking-pricing";
import type { BookingState } from "@/domain/booking/booking-types";

type Props = {
	bookingReference: BookingConfirmationPayload["bookingReference"];
	rentalDetails: BookingState["rentalDetails"];
	pricing: BookingPricingSummary;
};

function SummaryRow({
	label,
	value,
}: {
	label: string;
	value: string | null | undefined;
}) {
	return (
		<div className="flex items-start justify-between gap-3 text-sm">
			<span className="text-muted-foreground">{label}</span>
			<span className="text-right font-medium">{value ?? "—"}</span>
		</div>
	);
}

export function ConfirmationBookingSummary({
	bookingReference,
	rentalDetails,
	pricing,
}: Props) {
	return (
		<Card className="border-border/60">
			<CardContent className="p-5">
				<div className="mb-3 flex items-center gap-2">
					<Car className="size-4 text-muted-foreground" aria-hidden="true" />
					<h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
						Booking Summary
					</h2>
				</div>
				<Separator className="mb-4 opacity-60" />

				{/* Booking reference */}
				<div className="mb-4 rounded-lg border border-border/40 bg-muted/40 px-3 py-2.5">
					<p className="font-mono mb-0.5 text-xs text-muted-foreground">
						Booking Reference
					</p>
					<p
						className="font-mono text-sm font-bold tracking-wider"
						style={{ color: "var(--primary)" }}
					>
						{bookingReference}
					</p>
				</div>

				<div className="space-y-2.5">
					<SummaryRow
						label="Vehicle"
						value={rentalDetails.selectedVehicle?.name}
					/>
					<SummaryRow
						label="Category"
						value={rentalDetails.selectedVehicle?.category}
					/>
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
						<Calendar className="size-3" aria-hidden="true" />
						<span>Rental period</span>
					</div>
					<SummaryRow label="Pickup" value={rentalDetails.pickupDateTime} />
					<SummaryRow label="Return" value={rentalDetails.dropoffDateTime} />
					<Separator className="opacity-60" />
					<div className="flex justify-between font-semibold">
						<span>Total Paid</span>
						<span style={{ color: "var(--primary)" }}>EUR {pricing.total}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
