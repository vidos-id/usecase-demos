import { failure } from "@/api/responses";
import { handleBookingRoutes } from "@/api/routes/bookings";
import { handleCarRoutes } from "@/api/routes/cars";

export async function handleApiRequest(request: Request): Promise<Response> {
	const pathname = new URL(request.url).pathname;

	if (pathname.startsWith("/api/cars")) {
		return handleCarRoutes(request, pathname);
	}

	if (pathname.startsWith("/api/bookings")) {
		return handleBookingRoutes(request, pathname);
	}

	return failure("Not found.", 404);
}
