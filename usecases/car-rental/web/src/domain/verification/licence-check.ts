import type { NormalizedDisclosedClaims } from "@/domain/verification/verification-schemas";

export type LicenceCheckResult = {
	/** Whether the presented driving privileges include the required category */
	categoryMatch: boolean;
	/** Whether the licence expiry date is in the future */
	notExpired: boolean;
	/** Overall pass: both category and expiry must be valid */
	eligible: boolean;
	/** Categories found in the presented mDL */
	presentedCategories: string[];
	/** The required category that was checked */
	requiredCategory: string;
	/** Expiry date string from the mDL, if disclosed */
	expiryDate: string | null;
};

/**
 * Extract vehicle_category_code values from the raw driving_privileges array.
 * Handles both string entries and objects with `vehicle_category_code`.
 */
function extractCategories(privileges: unknown): string[] {
	if (!Array.isArray(privileges) || privileges.length === 0) {
		return [];
	}

	return privileges
		.map((entry) => {
			if (typeof entry === "string" && entry.trim().length > 0) {
				return entry.trim().toUpperCase();
			}

			if (entry && typeof entry === "object") {
				const category = (entry as Record<string, unknown>)
					.vehicle_category_code;
				if (typeof category === "string" && category.trim().length > 0) {
					return category.trim().toUpperCase();
				}
			}

			return null;
		})
		.filter((v): v is string => v !== null);
}

/**
 * Check whether the disclosed mDL claims satisfy the vehicle's licence requirements.
 */
export function checkLicenceCompatibility(
	disclosedClaims: NormalizedDisclosedClaims | null,
	requiredCategory: string,
): LicenceCheckResult {
	const required = requiredCategory.toUpperCase();

	if (!disclosedClaims) {
		return {
			categoryMatch: false,
			notExpired: false,
			eligible: false,
			presentedCategories: [],
			requiredCategory: required,
			expiryDate: null,
		};
	}

	const presentedCategories = extractCategories(
		disclosedClaims.mdl.drivingPrivileges,
	);
	const categoryMatch = presentedCategories.includes(required);

	const expiryDate = disclosedClaims.mdl.expiryDate ?? null;
	let notExpired = true;
	if (expiryDate) {
		const expiry = new Date(expiryDate);
		notExpired = !Number.isNaN(expiry.getTime()) && expiry > new Date();
	}

	return {
		categoryMatch,
		notExpired,
		eligible: categoryMatch && notExpired,
		presentedCategories,
		requiredCategory: required,
		expiryDate,
	};
}
