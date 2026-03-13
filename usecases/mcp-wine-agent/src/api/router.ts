import { failure } from "@/api/responses";
import { handleCartRoutes } from "@/api/routes/cart";
import { handleCheckoutRoutes } from "@/api/routes/checkout";
import { handleWineRoutes } from "@/api/routes/wines";

export async function handleApiRequest(request: Request): Promise<Response> {
	const pathname = new URL(request.url).pathname;

	if (pathname.startsWith("/api/wines")) {
		return handleWineRoutes(request, pathname);
	}

	if (pathname.startsWith("/api/cart")) {
		return handleCartRoutes(request, pathname);
	}

	if (pathname.startsWith("/api/checkout")) {
		return handleCheckoutRoutes(request, pathname);
	}

	return failure("Not found.", 404);
}
