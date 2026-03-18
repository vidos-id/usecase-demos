import { rentalTripContextSchema } from "demo-car-rental-shared/types/rental";
import { failure, parseJsonBody, success } from "@/api/responses";
import { searchCars } from "@/services/booking-store";

export async function handleCarRoutes(request: Request, pathname: string) {
	if (request.method !== "POST" || pathname !== "/api/cars/search") {
		return failure("Not found.", 404);
	}

	const parsed = await parseJsonBody(request, rentalTripContextSchema);
	if (!parsed.success) {
		return parsed.response;
	}

	const result = searchCars(parsed.data);

	return success(
		result.search.results.length > 0
			? `Found ${result.search.results.length} rental option(s) for ${parsed.data.destination}.`
			: `No rental cars matched ${parsed.data.destination}.`,
		{
			bookingSessionId: result.booking.bookingSessionId,
			search: result.search,
			nextStep:
				result.search.results.length > 0
					? "Ask the user to choose one vehicle, then call POST /api/bookings/select with the exact bookingSessionId and vehicleId."
					: null,
		},
	);
}
