import {
	PID_ATTRIBUTE_MAPPINGS,
	type PIDAttributeMapping,
} from "./pid-attributes";

export type PidClaimFormat = "sd-jwt" | "mdoc";

const INTERNAL_KEY_OVERRIDES: Record<string, string> = {
	resident_address: "resident_address",
};

const ID_TO_MAPPING = new Map(
	PID_ATTRIBUTE_MAPPINGS.map((mapping) => [mapping.id, mapping]),
);

function getMappingPath(
	mapping: PIDAttributeMapping,
	format: PidClaimFormat,
): string[] {
	return format === "sd-jwt" ? mapping.sdJwtPath : mapping.mdocPath;
}

function getValueAtPath(obj: Record<string, unknown>, path: string[]): unknown {
	let current: unknown = obj;
	for (const segment of path) {
		if (!current || typeof current !== "object") {
			return undefined;
		}
		current = (current as Record<string, unknown>)[segment];
	}
	return current;
}

function getStringValue(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getStringArrayValue(value: unknown): string[] | undefined {
	if (Array.isArray(value)) {
		const items = value.filter(
			(item): item is string => typeof item === "string" && item.length > 0,
		);
		return items.length > 0 ? items : undefined;
	}

	if (typeof value === "string" && value.length > 0) {
		return [value];
	}

	return undefined;
}

function formatAddressParts(
	address: Record<string, unknown>,
): string | undefined {
	const formatted = getStringValue(address.formatted);
	if (formatted) {
		return formatted;
	}

	const parts = [
		address.street_address,
		address.locality,
		address.region,
		address.postal_code,
		address.country,
	]
		.map((part) => getStringValue(part))
		.filter((part): part is string => Boolean(part));

	return parts.length > 0 ? parts.join(", ") : undefined;
}

function normalizeClaimValue(
	canonicalClaimId: string,
	value: unknown,
	rawClaims: Record<string, unknown>,
): unknown {
	if (canonicalClaimId === "nationality") {
		return getStringArrayValue(value);
	}

	if (canonicalClaimId === "resident_address") {
		if (typeof value === "string") {
			return getStringValue(value);
		}

		if (value && typeof value === "object") {
			return formatAddressParts(value as Record<string, unknown>);
		}

		const address = rawClaims.address;
		if (typeof address === "string") {
			return getStringValue(address);
		}
		if (address && typeof address === "object") {
			return formatAddressParts(address as Record<string, unknown>);
		}

		return undefined;
	}

	if (typeof value === "string") {
		return getStringValue(value);
	}

	return value;
}

export function getPidClaimPathByCanonicalId(
	canonicalClaimId: string,
	format: PidClaimFormat,
): string[] | undefined {
	const mapping = ID_TO_MAPPING.get(canonicalClaimId);
	return mapping ? getMappingPath(mapping, format) : undefined;
}

export function getCanonicalPidClaimIdByPath(
	path: string[],
	format: PidClaimFormat,
): string | undefined {
	for (const mapping of PID_ATTRIBUTE_MAPPINGS) {
		const mappingPath = getMappingPath(mapping, format);
		if (
			mappingPath.length === path.length &&
			mappingPath.every((segment, index) => segment === path[index])
		) {
			return mapping.id;
		}
	}

	return undefined;
}

export function getInternalPidClaimKeyByCanonicalId(
	canonicalClaimId: string,
): string | undefined {
	const mapping = ID_TO_MAPPING.get(canonicalClaimId);
	if (!mapping) {
		return undefined;
	}

	if (INTERNAL_KEY_OVERRIDES[canonicalClaimId]) {
		return INTERNAL_KEY_OVERRIDES[canonicalClaimId];
	}

	if (mapping.sdJwtPath.length === 1) {
		return mapping.sdJwtPath[0];
	}

	return canonicalClaimId;
}

export function getCanonicalPidClaimIdByInternalKey(
	internalKey: string,
): string | undefined {
	for (const mapping of PID_ATTRIBUTE_MAPPINGS) {
		const key = getInternalPidClaimKeyByCanonicalId(mapping.id);
		if (key === internalKey) {
			return mapping.id;
		}
	}

	return undefined;
}

export function normalizePidClaims(
	rawClaims: Record<string, unknown>,
): Record<string, unknown> {
	const normalizedClaims: Record<string, unknown> = { ...rawClaims };

	for (const mapping of PID_ATTRIBUTE_MAPPINGS) {
		const internalKey = getInternalPidClaimKeyByCanonicalId(mapping.id);
		if (!internalKey) {
			continue;
		}

		const internalValue = normalizedClaims[internalKey];
		const sdJwtValue = getValueAtPath(rawClaims, mapping.sdJwtPath);
		const mdocValue = getValueAtPath(rawClaims, mapping.mdocPath);

		const candidateValue =
			internalValue !== undefined
				? internalValue
				: sdJwtValue !== undefined
					? sdJwtValue
					: mdocValue;

		const normalizedValue = normalizeClaimValue(
			mapping.id,
			candidateValue,
			rawClaims,
		);

		if (normalizedValue !== undefined) {
			normalizedClaims[internalKey] = normalizedValue;
		}
	}

	return normalizedClaims;
}
