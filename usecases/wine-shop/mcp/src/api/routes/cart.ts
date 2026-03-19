import { z } from "zod";
import { failure, parseJsonBody, success } from "@/api/responses";
import {
	addToCart,
	createCart,
	getCartSummary,
	getWineById,
	removeFromCart,
} from "@/services/shopping";
import { AddToCartInputSchema } from "@/tools/shopping-tools";

const CartPathSchema = z.object({
	cartSessionId: z.string().min(1),
});

const CartItemPathSchema = z.object({
	cartSessionId: z.string().min(1),
	wineId: z.string().min(1),
});

export async function handleCartRoutes(request: Request, pathname: string) {
	if (request.method === "POST" && pathname === "/api/cart/items") {
		return handleAddToCart(request);
	}

	const cartItemMatch = pathname.match(
		/^\/api\/cart\/([^/]+)\/items\/([^/]+)$/,
	);
	if (request.method === "DELETE" && cartItemMatch) {
		return handleRemoveFromCart(cartItemMatch[1]!, cartItemMatch[2]!);
	}

	const cartMatch = pathname.match(/^\/api\/cart\/([^/]+)$/);
	if (request.method === "GET" && cartMatch) {
		return handleGetCart(cartMatch[1]!);
	}

	return failure("Not found.", 404);
}

async function handleAddToCart(request: Request) {
	const parsed = await parseJsonBody(request, AddToCartInputSchema);
	if (!parsed.success) {
		return parsed.response;
	}

	const { cartSessionId, wineId, quantity } = parsed.data;
	const wine = getWineById(wineId);
	if (!wine) {
		return failure(
			`Wine not found: ${wineId}. Use a wineId returned by /api/wines/search.`,
			404,
		);
	}

	const sessionId = cartSessionId ?? createCart().sessionId;

	try {
		addToCart(sessionId, wineId, quantity);
	} catch (error) {
		return failure(
			`${error instanceof Error ? error.message : "Failed to add to cart"}. Use the exact cartSessionId returned earlier.`,
			404,
		);
	}

	const summary = getCartSummary(sessionId);
	return success(`Added ${quantity} x ${wine.name} to cart.`, {
		cartSessionId: sessionId,
		summary,
	});
}

function handleGetCart(cartSessionId: string) {
	const parsed = CartPathSchema.safeParse({ cartSessionId });
	if (!parsed.success) {
		return failure(`Invalid input: ${parsed.error.message}`, 400);
	}

	const summary = getCartSummary(parsed.data.cartSessionId);
	if (!summary) {
		return failure(
			`Cart not found: ${parsed.data.cartSessionId}. Use the exact cartSessionId returned by POST /api/cart/items.`,
			404,
		);
	}

	return success("Cart loaded.", {
		cartSessionId: parsed.data.cartSessionId,
		summary,
	});
}

function handleRemoveFromCart(cartSessionId: string, wineId: string) {
	const parsed = CartItemPathSchema.safeParse({ cartSessionId, wineId });
	if (!parsed.success) {
		return failure(`Invalid input: ${parsed.error.message}`, 400);
	}

	const wine = getWineById(parsed.data.wineId);
	const cart = removeFromCart(parsed.data.cartSessionId, parsed.data.wineId);
	if (!cart) {
		return failure(
			`Cart not found: ${parsed.data.cartSessionId}. Use the exact cartSessionId returned by POST /api/cart/items.`,
			404,
		);
	}

	return success(
		wine
			? `Removed ${wine.name} from cart.`
			: `Removed ${parsed.data.wineId} from cart.`,
		{
			cartSessionId: parsed.data.cartSessionId,
			summary: getCartSummary(parsed.data.cartSessionId),
		},
	);
}
