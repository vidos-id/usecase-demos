export interface WineSearchCriteria {
	type?: string;
	region?: string;
	country?: string;
	maxPrice?: number;
	minPrice?: number;
	occasion?: string;
	qualityTier?: string;
}

export function normalizeText(value: string | undefined): string | undefined {
	const normalized = value
		?.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim()
		.toLowerCase();
	return normalized ? normalized : undefined;
}

export function normalizeType(value: string | undefined): string | undefined {
	const normalized = normalizeText(value);
	if (!normalized) return undefined;
	if (normalized === "rosé") return "rose";
	return normalized;
}

export function normalizeQualityTier(
	value: string | undefined,
): string | undefined {
	const normalized = normalizeText(value);
	if (!normalized) return undefined;

	if (["budget", "basic"].includes(normalized)) return "entry";
	if (["medium", "middle"].includes(normalized)) return "mid";
	if (["high", "high-end", "high end"].includes(normalized)) {
		return "premium";
	}

	return normalized;
}

export function normalizeWineSearchInput(
	input: WineSearchCriteria,
): WineSearchCriteria {
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
