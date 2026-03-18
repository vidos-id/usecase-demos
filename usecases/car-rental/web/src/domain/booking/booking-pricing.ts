import type { BookingRentalDetails } from "@/domain/booking/booking-types";

export type BookingPricingSummary = {
	days: number;
	subtotal: number;
	taxes: number;
	total: number;
	currency: "EUR";
};

const TAX_RATE = 0.19;
const MS_PER_DAY = 86_400_000;

export function calculateRentalDays(
	pickupDateTime: string | null,
	dropoffDateTime: string | null,
): number {
	if (!pickupDateTime || !dropoffDateTime) {
		return 0;
	}

	const pickup = new Date(pickupDateTime);
	const dropoff = new Date(dropoffDateTime);
	if (Number.isNaN(pickup.getTime()) || Number.isNaN(dropoff.getTime())) {
		return 0;
	}

	return Math.max(
		1,
		Math.round((dropoff.getTime() - pickup.getTime()) / MS_PER_DAY),
	);
}

export function createPricingSummary(
	rentalDetails: BookingRentalDetails,
): BookingPricingSummary {
	const days = calculateRentalDays(
		rentalDetails.pickupDateTime,
		rentalDetails.dropoffDateTime,
	);

	const subtotal = rentalDetails.selectedVehicle
		? rentalDetails.selectedVehicle.pricePerDay * days
		: 0;
	const taxes = Math.round(subtotal * TAX_RATE);

	return {
		days,
		subtotal,
		taxes,
		total: subtotal + taxes,
		currency: "EUR",
	};
}
