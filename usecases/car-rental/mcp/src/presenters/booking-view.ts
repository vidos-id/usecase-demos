import type {
	BookingSnapshot,
	BookingView,
	SearchCarsResult,
} from "@/schemas/booking";
import type { RentalSearchResponse } from "@/schemas/mcp";

export function toSearchCarsResult(
	bookingSessionId: string,
	search: RentalSearchResponse,
): SearchCarsResult {
	return {
		bookingSessionId,
		results: search.results,
	};
}

export function toBookingView(booking: BookingSnapshot): BookingView {
	return {
		bookingSessionId: booking.bookingSessionId,
		status: booking.status,
		destination: booking.destination,
		selectedVehicle: booking.selectedVehicle,
		requirements: booking.requirements
			? {
					requiredLicenceCategory: booking.requirements.requiredLicenceCategory,
				}
			: null,
		verification: booking.verification
			? {
					lifecycle: booking.verification.lifecycle,
					lastError: booking.verification.lastError,
				}
			: null,
		eligibility: booking.eligibility
			? {
					bookingApproved: booking.eligibility.bookingApproved,
					requiredLicenceCategory: booking.eligibility.requiredLicenceCategory,
					presentedCategories: booking.eligibility.presentedCategories,
					reasonCode: booking.eligibility.reasonCode,
					reasonText: booking.eligibility.reasonText,
				}
			: null,
		confirmation: booking.confirmation
			? {
					bookingReference: booking.confirmation.bookingReference,
					pickupLocation: {
						name: booking.confirmation.pickupLocation.name,
					},
					lockerId: booking.confirmation.lockerId,
					lockerPin: booking.confirmation.lockerPin,
					instructions: booking.confirmation.instructions,
				}
			: null,
	};
}
