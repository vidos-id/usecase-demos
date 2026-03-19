import { failure, parseJsonBody, success } from "@/api/responses";
import { findWinesByCriteria, getAllWines } from "@/services/shopping";
import { SearchWinesInputSchema } from "@/tools/shopping-tools";

function normalizeText(value: string | undefined): string | undefined {
	const normalized = value
		?.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim()
		.toLowerCase();
	return normalized ? normalized : undefined;
}

function normalizeType(value: string | undefined): string | undefined {
	const normalized = normalizeText(value);
	if (!normalized) return undefined;
	if (normalized === "rose") return "rose";
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

function normalizeSearchInput(input: {
	type?: string;
	region?: string;
	country?: string;
	maxPrice?: number;
	minPrice?: number;
	occasion?: string;
	qualityTier?: string;
}) {
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

export async function handleWineRoutes(request: Request, pathname: string) {
	if (request.method !== "POST" || pathname !== "/api/wines/search") {
		return failure("Not found.", 404);
	}

	const parsed = await parseJsonBody(request, SearchWinesInputSchema);
	if (!parsed.success) {
		return parsed.response;
	}

	const criteria = normalizeSearchInput(parsed.data);
	const hasFilters = Object.values(criteria).some(
		(value) => value !== undefined,
	);
	const wines = hasFilters ? findWinesByCriteria(criteria) : getAllWines();
	const results = wines.slice(0, 5);

	return success(
		results.length > 0
			? `Found ${results.length} wine result(s).`
			: "No wines match your criteria.",
		{
			count: results.length,
			wines: results,
		},
	);
}
