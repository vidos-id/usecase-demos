import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolResponse } from "@/schemas/catalog";
import {
	addToCart,
	createCart,
	findWinesByCriteria,
	getAllWines,
	getCartSummary,
	getWineById,
	removeFromCart,
} from "@/services/shopping";
import { logDebug } from "@/utils/debug";

export const SearchWinesInputSchema = z.object({
	type: z.string().optional(),
	region: z.string().optional(),
	country: z.string().optional(),
	maxPrice: z.number().optional(),
	minPrice: z.number().optional(),
	occasion: z.string().optional(),
	qualityTier: z.string().optional(),
});

function normalizeSearchInput(input: z.infer<typeof SearchWinesInputSchema>) {
	return {
		type: normalizeType(input.type),
		region: normalizeText(input.region),
		country: normalizeText(input.country),
		maxPrice: input.maxPrice,
		minPrice: input.minPrice,
		occasion: normalizeText(input.occasion),
		qualityTier: normalizeQualityTier(input.qualityTier),
	};
}

function normalizeText(value: string | undefined): string | undefined {
	const normalized = value?.trim().toLowerCase();
	return normalized ? normalized : undefined;
}

function normalizeType(value: string | undefined): string | undefined {
	const normalized = normalizeText(value);
	if (!normalized) return undefined;
	if (normalized === "rosé") return "rose";
	return normalized;
}

function normalizeQualityTier(value: string | undefined): string | undefined {
	const normalized = normalizeText(value);
	if (!normalized) return undefined;

	if (["budget", "basic"].includes(normalized)) return "entry";
	if (["medium", "middle"].includes(normalized)) return "mid";
	if (["high", "high-end", "high end"].includes(normalized)) {
		return "premium";
	}

	return normalized;
}

export const AddToCartInputSchema = z.object({
	cartSessionId: z.string().optional(),
	wineId: z.string(),
	quantity: z.number().int().positive().default(1),
});

export const RemoveFromCartInputSchema = z.object({
	cartSessionId: z.string(),
	wineId: z.string(),
});

export const GetCartInputSchema = z.object({
	cartSessionId: z.string(),
});

function toToolResult(result: ToolResponse) {
	return {
		content: [{ type: "text" as const, text: result.message }],
		data: result.data,
		isError: !result.success,
	};
}

export function searchWinesTool(args: unknown): ToolResponse {
	logDebug("tool:search_wines", "called", args);
	const parsed = SearchWinesInputSchema.safeParse(args);
	if (!parsed.success) {
		logDebug(
			"tool:search_wines",
			"input validation failed",
			parsed.error.format(),
		);
		return {
			success: false,
			message: `Invalid input: ${parsed.error.message}`,
		};
	}

	const criteria = normalizeSearchInput(parsed.data);
	logDebug("tool:search_wines", "normalized criteria", criteria);
	const wines =
		Object.keys(criteria).filter(
			(key) => criteria[key as keyof typeof criteria] !== undefined,
		).length === 0
			? getAllWines()
			: findWinesByCriteria(criteria);
	const topWines = wines.slice(0, 5);
	logDebug("tool:search_wines", "ranked results prepared", {
		matchedCount: wines.length,
		returnedCount: topWines.length,
		wineIds: topWines.map((wine) => wine.id),
	});

	const wineTexts = topWines.map((wine) => {
		const occasionText = wine.occasion?.length
			? ` Perfect for: ${wine.occasion.join(", ")}.`
			: "";
		const foodText = wine.foodPairing?.length
			? ` Pairs with: ${wine.foodPairing.join(", ")}.`
			: "";
		return `- **${wine.name}** (${wine.year}) - ${wine.region}, ${wine.country} - €${wine.price}\n  Wine ID: \`${wine.id}\`\n  ${wine.description}${occasionText}${foodText}`;
	});

	return {
		success: true,
		message:
			topWines.length > 0
				? `Found ${topWines.length} ranked wine result(s):\n\n${wineTexts.join("\n\n")}\n\nResults are ranked by the closest match, so they do not need to match every filter exactly. If the user likes one, call \`add_to_cart\` with its exact \`wineId\`. If no cart exists yet, \`add_to_cart\` will create one and return \`cartSessionId\`. Reuse that exact \`cartSessionId\` for \`get_cart\`, \`remove_from_cart\`, and \`initiate_checkout\`.`
				: "No wines match your criteria.",
		data: {
			count: topWines.length,
			wines: topWines.map((wine) => ({
				id: wine.id,
				name: wine.name,
				type: wine.type,
				region: wine.region,
				country: wine.country,
				year: wine.year,
				price: wine.price,
				qualityTier: wine.qualityTier,
			})),
		},
	};
}

export function addToCartTool(args: unknown): ToolResponse {
	logDebug("tool:add_to_cart", "called", args);
	const parsed = AddToCartInputSchema.safeParse(args);
	if (!parsed.success) {
		logDebug(
			"tool:add_to_cart",
			"input validation failed",
			parsed.error.format(),
		);
		return {
			success: false,
			message: `Invalid input: ${parsed.error.message}`,
		};
	}

	const { cartSessionId, wineId, quantity } = parsed.data;

	const wine = getWineById(wineId);
	if (!wine) {
		logDebug("tool:add_to_cart", "wine not found", { wineId });
		return {
			success: false,
			message:
				`Wine not found: ${wineId}. ` +
				"Use the exact `wineId` returned by `search_wines`.",
		};
	}

	let sessionId = cartSessionId;
	if (!sessionId) {
		const cart = createCart();
		sessionId = cart.sessionId;
		logDebug("tool:add_to_cart", "created new cart", {
			cartSessionId: sessionId,
		});
	}

	try {
		addToCart(sessionId, wineId, quantity);
	} catch (error) {
		logDebug("tool:add_to_cart", "failed to add item to cart", {
			cartSessionId: sessionId,
			wineId,
			error: error instanceof Error ? error.message : String(error),
		});
		return {
			success: false,
			message:
				`Failed to add to cart: ${error instanceof Error ? error.message : String(error)}. ` +
				"Use the exact `cartSessionId` returned earlier.",
		};
	}

	const summary = getCartSummary(sessionId);
	logDebug("tool:add_to_cart", "added item to cart", {
		cartSessionId: sessionId,
		wineId,
		quantity,
		totalItems: summary?.totalItems,
		subtotal: summary?.subtotal,
	});

	return {
		success: true,
		message:
			`Added ${quantity} x ${wine.name} to cart. ` +
			`Cart now has ${summary?.totalItems} item(s) totaling €${summary?.subtotal}. ` +
			`Use this cartSessionId for all next cart steps: \`${sessionId}\`. ` +
			"If the user wants to review the cart, call `get_cart` with this `cartSessionId`. If the user is ready to buy, call `initiate_checkout` with this `cartSessionId`.",
		data: { cartSessionId: sessionId, summary },
	};
}

export function removeFromCartTool(args: unknown): ToolResponse {
	logDebug("tool:remove_from_cart", "called", args);
	const parsed = RemoveFromCartInputSchema.safeParse(args);
	if (!parsed.success) {
		logDebug(
			"tool:remove_from_cart",
			"input validation failed",
			parsed.error.format(),
		);
		return {
			success: false,
			message: `Invalid input: ${parsed.error.message}`,
		};
	}

	const { cartSessionId, wineId } = parsed.data;
	const wine = getWineById(wineId);

	const cart = removeFromCart(cartSessionId, wineId);
	if (!cart) {
		logDebug("tool:remove_from_cart", "cart not found", {
			cartSessionId,
			wineId,
		});
		return {
			success: false,
			message: `Cart not found: ${cartSessionId}. Use the exact cartSessionId returned by add_to_cart.`,
		};
	}

	const summary = getCartSummary(cartSessionId);
	logDebug("tool:remove_from_cart", "removed item from cart", {
		cartSessionId,
		wineId,
		totalItems: summary?.totalItems,
		subtotal: summary?.subtotal,
	});

	return {
		success: true,
		message: wine
			? `Removed ${wine.name} from cart. Reuse cartSessionId \`${cartSessionId}\` for any further cart or checkout actions.`
			: `Removed item from cart. Cart now has ${summary?.totalItems} item(s) totaling €${summary?.subtotal}. Reuse cartSessionId \`${cartSessionId}\` for any further cart or checkout actions.`,
		data: { cartSessionId, summary },
	};
}

export function getCartTool(args: unknown): ToolResponse {
	logDebug("tool:get_cart", "called", args);
	const parsed = GetCartInputSchema.safeParse(args);
	if (!parsed.success) {
		logDebug("tool:get_cart", "input validation failed", parsed.error.format());
		return {
			success: false,
			message: `Invalid input: ${parsed.error.message}`,
		};
	}

	const summary = getCartSummary(parsed.data.cartSessionId);
	if (!summary) {
		logDebug("tool:get_cart", "cart not found", {
			cartSessionId: parsed.data.cartSessionId,
		});
		return {
			success: false,
			message: `Cart not found: ${parsed.data.cartSessionId}. Use the exact cartSessionId returned by add_to_cart.`,
		};
	}

	const itemTexts = summary.items.map((item) => {
		return `- ${item.quantity} x ${item.wine.name} (€${item.wine.price} each) = €${item.lineTotal}`;
	});

	const verificationText = summary.requiresVerification
		? "\n\n⚠️ This cart contains age-restricted items and requires verification before checkout."
		: "";

	logDebug("tool:get_cart", "cart summary prepared", {
		cartSessionId: parsed.data.cartSessionId,
		totalItems: summary.totalItems,
		subtotal: summary.subtotal,
		requiresVerification: summary.requiresVerification,
	});

	return {
		success: true,
		message:
			`Cart (${summary.totalItems} items, €${summary.subtotal}):\n\n${itemTexts.join("\n")}${verificationText}\n\n` +
			`Reuse cartSessionId \`${parsed.data.cartSessionId}\`. ` +
			"If the user wants to buy, call `initiate_checkout` with this `cartSessionId` next.",
		data: { cartSessionId: parsed.data.cartSessionId, summary },
	};
}

export function registerSearchWinesTool(server: McpServer) {
	server.registerTool(
		"search_wines",
		{
			description:
				"Search the wine catalog by type, region, price range, occasion, or quality tier. Returns matching wines with descriptions, tasting notes, and pairing suggestions.",
			inputSchema: SearchWinesInputSchema,
		},
		async (args) => toToolResult(searchWinesTool(args)),
	);
}

export function registerAddToCartTool(server: McpServer) {
	server.registerTool(
		"add_to_cart",
		{
			description:
				"Add a wine to a cart. If cartSessionId is omitted, a new cart is created and returned. Reuse the returned cartSessionId in later cart and checkout calls.",
			inputSchema: AddToCartInputSchema,
		},
		async (args) => toToolResult(addToCartTool(args)),
	);
}

export function registerRemoveFromCartTool(server: McpServer) {
	server.registerTool(
		"remove_from_cart",
		{
			description:
				"Remove a wine from a cart by wine ID. Requires the exact cartSessionId returned earlier.",
			inputSchema: RemoveFromCartInputSchema,
		},
		async (args) => toToolResult(removeFromCartTool(args)),
	);
}

export function registerGetCartTool(server: McpServer) {
	server.registerTool(
		"get_cart",
		{
			description:
				"Get the current cart contents and summary, including verification requirements. Requires the exact cartSessionId returned earlier.",
			inputSchema: GetCartInputSchema,
		},
		async (args) => toToolResult(getCartTool(args)),
	);
}

export function registerShoppingTools(server: McpServer) {
	registerSearchWinesTool(server);
	registerAddToCartTool(server);
	registerRemoveFromCartTool(server);
	registerGetCartTool(server);
}
