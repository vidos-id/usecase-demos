import { Separator } from "@/components/ui/separator";
import type { BookingPricingSummary } from "@/domain/booking/booking-pricing";
import type { BookingState } from "@/domain/booking/booking-types";

type Props = {
	bookingId: BookingState["bookingId"];
	rentalDetails: BookingState["rentalDetails"];
	pricing: BookingPricingSummary;
};

export function PaymentOrderSummary({
	bookingId,
	rentalDetails,
	pricing,
}: Props) {
	const { selectedVehicle } = rentalDetails;

	return (
		<div className="mb-5">
			<h3 className="font-heading mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
				Order Summary
			</h3>
			<Separator className="mb-3 opacity-60" />

			{bookingId && (
				<div className="mb-3 rounded-lg border border-border/40 bg-muted/40 px-3 py-2">
					<p className="font-mono text-xs text-muted-foreground">Booking ID</p>
					<p
						className="font-mono mt-0.5 break-all text-xs font-semibold"
						style={{ color: "var(--primary)" }}
					>
						{bookingId}
					</p>
				</div>
			)}

			{selectedVehicle && (
				<div className="space-y-2 text-sm">
					<div className="flex justify-between">
						<span className="text-muted-foreground">
							{selectedVehicle.name}
						</span>
						<span className="font-medium">{selectedVehicle.category}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">
							€{selectedVehicle.pricePerDay} × {pricing.days} day
							{pricing.days !== 1 ? "s" : ""}
						</span>
						<span>€{pricing.subtotal}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Tax (19%)</span>
						<span>€{pricing.taxes}</span>
					</div>
					<Separator className="my-2 opacity-60" />
					<div className="flex justify-between font-bold">
						<span>Total Due</span>
						<span
							className="font-heading text-lg"
							style={{ color: "var(--primary)" }}
						>
							€{pricing.total}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
