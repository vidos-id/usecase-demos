import { Car as CarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BookingState } from "@/domain/booking/booking-types";

type Props = {
	booking: BookingState;
};

function formatDate(iso: string | null) {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function calcDays(pickup: string | null, dropoff: string | null): number {
	if (!pickup || !dropoff) return 0;
	const p = new Date(pickup);
	const d = new Date(dropoff);
	if (Number.isNaN(p.getTime()) || Number.isNaN(d.getTime())) return 0;
	return Math.max(1, Math.round((d.getTime() - p.getTime()) / 86400000));
}

export function VerificationBookingCard({ booking }: Props) {
	const { bookingId, rentalDetails, status } = booking;
	const { location, pickupDateTime, dropoffDateTime, selectedVehicle } =
		rentalDetails;

	const days = calcDays(pickupDateTime, dropoffDateTime);
	const subtotal = selectedVehicle ? selectedVehicle.pricePerDay * days : 0;
	const taxes = Math.round(subtotal * 0.19);
	const total = subtotal + taxes;

	return (
		<Card className="border-border/60">
			<CardContent className="p-5">
				<h3 className="font-heading mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
					Booking Context
				</h3>
				<Separator className="mb-3 opacity-60" />

				{/* Booking ID */}
				<div className="mb-3 rounded-lg border border-border/40 bg-muted/40 px-3 py-2">
					<p className="font-mono text-xs text-muted-foreground">Booking ID</p>
					<p
						className="font-mono mt-0.5 break-all text-xs font-semibold tracking-tight"
						style={{ color: "var(--primary)" }}
					>
						{bookingId ?? "—"}
					</p>
				</div>

				{/* Status */}
				<div className="mb-3 flex items-center justify-between text-xs">
					<span className="text-muted-foreground">Booking Status</span>
					<span className="font-semibold capitalize">
						{status.replace(/_/g, " ")}
					</span>
				</div>

				<Separator className="mb-3 opacity-40" />

				{/* Rental details */}
				<div className="space-y-2 text-xs">
					{location && (
						<div className="flex justify-between gap-2">
							<span className="text-muted-foreground">Location</span>
							<span className="font-medium">{location.code}</span>
						</div>
					)}
					{pickupDateTime && (
						<div className="flex justify-between gap-2">
							<span className="text-muted-foreground">Pickup</span>
							<span className="font-medium">{formatDate(pickupDateTime)}</span>
						</div>
					)}
					{dropoffDateTime && (
						<div className="flex justify-between gap-2">
							<span className="text-muted-foreground">Return</span>
							<span className="font-medium">{formatDate(dropoffDateTime)}</span>
						</div>
					)}
					{selectedVehicle && (
						<div className="flex items-center justify-between gap-2">
							<span className="text-muted-foreground">Vehicle</span>
							<span className="flex items-center gap-1 font-medium">
								<CarIcon className="size-3" />
								{selectedVehicle.name}
							</span>
						</div>
					)}
				</div>

				{/* Price */}
				{selectedVehicle && days > 0 && (
					<>
						<Separator className="my-3 opacity-40" />
						<div className="space-y-1.5 text-xs">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									€{selectedVehicle.pricePerDay} × {days}d
								</span>
								<span>€{subtotal}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Tax (19%)</span>
								<span>€{taxes}</span>
							</div>
							<div className="flex justify-between font-bold">
								<span>Total</span>
								<span style={{ color: "var(--primary)" }}>€{total}</span>
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
