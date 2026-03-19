import { randomUUID } from "node:crypto";
import { wines } from "demo-wine-shop-shared/lib/wines";
import type {
	Cart,
	CartSummary,
	WineProduct,
} from "demo-wine-shop-shared/types/catalog";
import { logDebug } from "@/utils/debug";

const carts = new Map<string, Cart>();

export function createCart(): Cart {
	const now = new Date().toISOString();
	const cart: Cart = {
		items: [],
		sessionId: randomUUID(),
		createdAt: now,
		updatedAt: now,
	};
	carts.set(cart.sessionId, cart);
	logDebug("shopping", "created cart", { cartSessionId: cart.sessionId });
	return cart;
}

export function getCart(sessionId: string): Cart | undefined {
	return carts.get(sessionId);
}

export function addToCart(
	sessionId: string,
	wineId: string,
	quantity: number,
): Cart {
	const cart = carts.get(sessionId);
	if (!cart) {
		logDebug("shopping", "cart missing during add", {
			cartSessionId: sessionId,
			wineId,
		});
		throw new Error("Cart not found");
	}

	const existingItem = cart.items.find((item) => item.wineId === wineId);
	if (existingItem) {
		existingItem.quantity += quantity;
	} else {
		cart.items.push({ wineId, quantity });
	}

	cart.updatedAt = new Date().toISOString();
	carts.set(cart.sessionId, cart);
	logDebug("shopping", "cart updated after add", {
		cartSessionId: cart.sessionId,
		wineId,
		quantity,
		itemCount: cart.items.length,
	});
	return cart;
}

export function removeFromCart(
	sessionId: string,
	wineId: string,
): Cart | undefined {
	const cart = carts.get(sessionId);
	if (!cart) {
		logDebug("shopping", "remove requested for missing cart", {
			cartSessionId: sessionId,
			wineId,
		});
		return undefined;
	}

	cart.items = cart.items.filter((item) => item.wineId !== wineId);
	cart.updatedAt = new Date().toISOString();
	carts.set(sessionId, cart);
	logDebug("shopping", "cart updated after remove", {
		cartSessionId: sessionId,
		wineId,
		itemCount: cart.items.length,
	});
	return cart;
}

export function getCartSummary(sessionId: string): CartSummary | undefined {
	const cart = carts.get(sessionId);
	if (!cart) {
		logDebug("shopping", "summary requested for missing cart", {
			cartSessionId: sessionId,
		});
		return undefined;
	}

	const items = cart.items
		.map((item) => {
			const wine = wines.find((w) => w.id === item.wineId);
			if (!wine) return null;
			return {
				wine,
				quantity: item.quantity,
				lineTotal: wine.price * item.quantity,
			};
		})
		.filter((item): item is NonNullable<typeof item> => item !== null);

	const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
	const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
	const requiresVerification = items.some((item) => item.wine.ageRestricted);
	logCartSummary(sessionId, totalItems, subtotal, requiresVerification);

	return {
		items,
		totalItems,
		subtotal,
		currency: "EUR",
		requiresVerification,
		verificationReason: requiresVerification
			? "Age verification required for wine purchases"
			: undefined,
	};
}

function logCartSummary(
	cartSessionId: string,
	totalItems: number,
	subtotal: number,
	requiresVerification: boolean,
) {
	logDebug("shopping", "cart summary built", {
		cartSessionId,
		totalItems,
		subtotal,
		requiresVerification,
	});
}

export function findWinesByCriteria(criteria: {
	type?: string;
	region?: string;
	country?: string;
	maxPrice?: number;
	minPrice?: number;
	occasion?: string;
	qualityTier?: string;
}): WineProduct[] {
	logDebug("shopping", "ranking wines by criteria", criteria);
	const ranked = wines
		.map((wine) => ({
			wine,
			score: scoreWineMatch(wine, criteria),
		}))
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score || a.wine.price - b.wine.price)
		.map((entry) => entry.wine);

	if (ranked.length > 0) {
		logDebug("shopping", "ranked wine matches found", {
			count: ranked.length,
			wineIds: ranked.map((wine) => wine.id),
		});
		return ranked;
	}

	logDebug("shopping", "no positive score matches, falling back to price sort");
	return [...wines].sort((a, b) => a.price - b.price);
}

function scoreWineMatch(
	wine: WineProduct,
	criteria: {
		type?: string;
		region?: string;
		country?: string;
		maxPrice?: number;
		minPrice?: number;
		occasion?: string;
		qualityTier?: string;
	},
): number {
	let score = 0;

	if (criteria.type) {
		score += wine.type === criteria.type ? 5 : 0;
	}

	if (criteria.qualityTier) {
		score += wine.qualityTier === criteria.qualityTier ? 4 : 0;
	}

	if (criteria.region) {
		const region = criteria.region.toLowerCase();
		score += wine.region.toLowerCase().includes(region) ? 3 : 0;
	}

	if (criteria.country) {
		const country = criteria.country.toLowerCase();
		score += wine.country.toLowerCase().includes(country) ? 3 : 0;
	}

	if (criteria.occasion && wine.occasion?.length) {
		const occasion = criteria.occasion.toLowerCase();
		score += wine.occasion.some((occ) => occ.toLowerCase().includes(occasion))
			? 2
			: 0;
	}

	if (criteria.minPrice || criteria.maxPrice) {
		const minPrice = criteria.minPrice ?? 0;
		const maxPrice = criteria.maxPrice ?? Number.POSITIVE_INFINITY;

		if (wine.price >= minPrice && wine.price <= maxPrice) {
			score += 2;
		} else {
			const distance =
				wine.price < minPrice ? minPrice - wine.price : wine.price - maxPrice;
			if (distance <= 15) {
				score += 1;
			}
		}
	}

	if (Object.keys(criteria).length === 0) {
		score += 1;
	}

	return score;
}

export function getWineById(id: string): WineProduct | undefined {
	return wines.find((w) => w.id === id);
}

export function getAllWines(): WineProduct[] {
	return wines;
}
