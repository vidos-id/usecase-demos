import type { BookingConfirmationPayload } from "@/domain/booking/booking-confirmation";

export type BookingLifecycleStatus =
	| "draft"
	| "reviewed"
	| "awaiting_verification"
	| "verified"
	| "payment_confirmed"
	| "completed"
	| "failed";

export type BookingLocation = {
	id: string;
	name: string;
	code: string;
};

export type BookingVehicle = {
	id: string;
	name: string;
	category: string;
	requiredLicenceCategory: string;
	imageUrl: string;
	pricePerDay: number;
	currency: "EUR";
};

export type BookingRentalDetails = {
	location: BookingLocation | null;
	pickupDateTime: string | null;
	dropoffDateTime: string | null;
	selectedVehicle: BookingVehicle | null;
};

export type BookingState = {
	status: BookingLifecycleStatus;
	bookingId: string | null;
	rentalDetails: BookingRentalDetails;
	confirmation: BookingConfirmationPayload | null;
	updatedAt: string;
	lastError: string | null;
};

export type BookingValidationKey =
	| "location"
	| "pickupDateTime"
	| "dropoffDateTime"
	| "selectedVehicle";

export type BookingTransitionResult =
	| {
			ok: true;
			state: BookingState;
	  }
	| {
			ok: false;
			error: string;
			state: BookingState;
	  };

export const BOOKING_REQUIRED_FIELDS: BookingValidationKey[] = [
	"location",
	"pickupDateTime",
	"dropoffDateTime",
	"selectedVehicle",
];
