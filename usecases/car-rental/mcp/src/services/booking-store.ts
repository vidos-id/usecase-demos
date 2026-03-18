import { randomUUID } from "node:crypto";
import {
	estimateRentalDays,
	estimateRentalTotal,
	rankCarsForTrip,
	toBookingVehicle,
} from "demo-car-rental-shared/lib/cars";
import {
	type BookingLocation,
	type BookingVehicle,
	bookingLocationSchema,
	type RentalTripContext,
	type RentalVehicle,
} from "demo-car-rental-shared/types/rental";
import type {
	BookingSnapshot,
	BookingStatus,
	VerificationSnapshot,
} from "@/schemas/booking";
import type {
	PickupConfirmation,
	RentalEligibility,
	RentalSearchResponse,
} from "@/schemas/mcp";

type BookingRecord = BookingSnapshot & {
	search?: RentalSearchResponse;
	selectedVehicleFull?: RentalVehicle;
};

const bookings = new Map<string, BookingRecord>();

const DEFAULT_PICKUP_LOCATION = bookingLocationSchema.parse({
	id: "airport-hub",
	name: "Airport smart pickup zone",
	code: "APT",
});

function now() {
	return new Date().toISOString();
}

export function createBookingSessionId() {
	return `rental_${randomUUID()}`;
}

export function createVerificationSessionId() {
	return `verify_${randomUUID()}`;
}

export function createNonce() {
	return randomUUID().replace(/-/g, "");
}

function createBaseBooking(trip: RentalTripContext): BookingRecord {
	const bookingSessionId = createBookingSessionId();
	const timestamp = now();
	return {
		bookingSessionId,
		status: "search_ready",
		destination: trip.destination,
		trip,
		selectedVehicle: null,
		pickupLocation: {
			...DEFAULT_PICKUP_LOCATION,
			name: `${trip.destination} pickup hub`,
			code: trip.destination.slice(0, 3).toUpperCase(),
		},
		requirements: null,
		verification: null,
		eligibility: null,
		confirmation: null,
		updatedAt: timestamp,
	};
}

export function searchCars(trip: RentalTripContext): {
	booking: BookingSnapshot;
	search: RentalSearchResponse;
} {
	const ranked = rankCarsForTrip(trip);
	const days = estimateRentalDays({
		pickupDate: trip.pickupDate,
		dropoffDate: trip.dropoffDate,
	});
	const results = ranked.slice(0, 5).map((vehicle) => ({
		vehicle: toBookingVehicle(vehicle),
		totalEstimate: estimateRentalTotal(vehicle, days),
		estimatedDays: days,
		reason: vehicle.comparisonHighlights.join(", "),
	}));

	const search: RentalSearchResponse = {
		trip,
		results,
		summary:
			results.length > 0
				? `Top ${results.length} rentals for ${trip.destination}, ranked for this trip context.`
				: `No rentals matched ${trip.destination}.`,
	};

	const booking = createBaseBooking(trip);
	booking.search = search;
	bookings.set(booking.bookingSessionId, booking);

	return { booking, search };
}

export function getBooking(bookingSessionId: string): BookingRecord {
	const booking = bookings.get(bookingSessionId);
	if (!booking) {
		throw new Error(`Booking session not found: ${bookingSessionId}`);
	}
	return booking;
}

function normalizeVehicleId(vehicleId: string): string {
	return vehicleId
		.normalize("NFKC")
		.trim()
		.replace(/^[`'"'"\u2018\u2019\u201C\u201D]+/, "")
		.replace(/[`'"'"\u2018\u2019\u201C\u201D]+$/, "")
		.toLowerCase();
}

export function selectCar(
	bookingSessionId: string,
	vehicleId: string,
): BookingSnapshot {
	const booking = getBooking(bookingSessionId);
	const normalizedVehicleId = normalizeVehicleId(vehicleId);
	const matched = rankCarsForTrip(booking.trip).find(
		(vehicle) => normalizeVehicleId(vehicle.id) === normalizedVehicleId,
	);
	if (!matched) {
		const availableIds = (booking.search?.results ?? [])
			.map((result) => result.vehicle.id)
			.join(", ");
		throw new Error(
			`Vehicle not found: ${vehicleId}. Use one of the exact vehicleId values returned by search_cars: ${availableIds}`,
		);
	}

	booking.selectedVehicleFull = matched;
	booking.selectedVehicle = toBookingVehicle(matched);
	booking.requirements = {
		minimumAge: matched.minimumDriverAge,
		requiredLicenceCategory: matched.requiredLicenceCategory,
	};
	booking.status = "car_selected";
	booking.updatedAt = now();

	return booking;
}

export function setVerification(
	bookingSessionId: string,
	verification: VerificationSnapshot,
	status: BookingStatus,
): BookingSnapshot {
	const booking = getBooking(bookingSessionId);
	booking.verification = verification;
	booking.status = status;
	booking.updatedAt = now();
	return booking;
}

export function finalizeEligibility(
	bookingSessionId: string,
	eligibility: RentalEligibility,
	confirmation: PickupConfirmation | null,
): BookingSnapshot {
	const booking = getBooking(bookingSessionId);
	booking.eligibility = eligibility;
	booking.confirmation = confirmation;
	booking.status = eligibility.bookingApproved
		? "approved"
		: eligibility.reasonCode === "verification_expired"
			? "expired"
			: eligibility.reasonCode === "authorizer_error"
				? "error"
				: "rejected";
	booking.updatedAt = now();
	return booking;
}

export function createPickupConfirmation(
	booking: BookingSnapshot,
): PickupConfirmation {
	const seed = booking.bookingSessionId
		.replace(/[^A-Z0-9]/gi, "")
		.slice(-8)
		.toUpperCase();
	const pin = `${booking.bookingSessionId.length}${booking.destination.length}`
		.padEnd(4, "7")
		.slice(0, 4);
	return {
		bookingReference: booking.bookingSessionId
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, "")
			.slice(0, 12),
		pickupLocation: booking.pickupLocation,
		lockerId: `${booking.pickupLocation.code}-L${seed.slice(0, 3)}`,
		lockerPin: pin,
		instructions: `Go to ${booking.pickupLocation.name}, open locker ${booking.pickupLocation.code}-L${seed.slice(0, 3)}, then enter PIN ${pin} at the kiosk to release the key box.`,
	};
}

export function listBookingSearchResults(
	bookingSessionId: string,
): RentalSearchResponse | null {
	return getBooking(bookingSessionId).search ?? null;
}

export function getSelectedVehicle(
	bookingSessionId: string,
): BookingVehicle | null {
	return getBooking(bookingSessionId).selectedVehicle;
}
