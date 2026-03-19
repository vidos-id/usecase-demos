import { failure, parseJsonBody, success } from "@/api/responses";
import { findWinesByCriteria, getAllWines } from "@/services/shopping";
import { SearchWinesInputSchema } from "@/tools/shopping-tools";
import { normalizeWineSearchInput } from "@/utils/search-normalization";

export async function handleWineRoutes(request: Request, pathname: string) {
	if (request.method !== "POST" || pathname !== "/api/wines/search") {
		return failure("Not found.", 404);
	}

	const parsed = await parseJsonBody(request, SearchWinesInputSchema);
	if (!parsed.success) {
		return parsed.response;
	}

	const criteria = normalizeWineSearchInput(parsed.data);
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
