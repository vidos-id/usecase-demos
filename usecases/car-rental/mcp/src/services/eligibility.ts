import type { BookingVehicle } from "demo-car-rental-shared/types/rental";
import type { RentalEligibility } from "@/schemas/mcp";
import type { AuthorizerCredential } from "@/services/vidos-client";

type NormalizedClaims = {
	mdlExpiryDate: string | null;
	presentedCategories: string[];
	fullName: string | null;
	mdlNumber: string | null;
};

function extractCategories(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.map((entry) => {
			if (typeof entry === "string") {
				return entry.trim().toUpperCase();
			}
			if (entry && typeof entry === "object") {
				const category = (entry as Record<string, unknown>)
					.vehicle_category_code;
				return typeof category === "string"
					? category.trim().toUpperCase()
					: null;
			}
			return null;
		})
		.filter((entry): entry is string => Boolean(entry));
}

export function normalizeCredentials(
	credentials: AuthorizerCredential[],
): NormalizedClaims {
	const pid = credentials.find((credential) =>
		credential.credentialType.toLowerCase().includes("pid"),
	);
	const mdl = credentials.find(
		(credential) => credential.format === "mso_mdoc",
	);
	const givenName = (mdl?.claims.given_name ?? pid?.claims.given_name) as
		| string
		| undefined;
	const familyName = (mdl?.claims.family_name ?? pid?.claims.family_name) as
		| string
		| undefined;

	return {
		mdlExpiryDate:
			typeof mdl?.claims.expiry_date === "string"
				? mdl.claims.expiry_date
				: null,
		presentedCategories: extractCategories(mdl?.claims.driving_privileges),
		fullName:
			givenName || familyName
				? [givenName, familyName].filter(Boolean).join(" ")
				: null,
		mdlNumber:
			typeof mdl?.claims.document_number === "string"
				? mdl.claims.document_number
				: null,
	};
}

export function evaluateEligibility(
	vehicle: BookingVehicle,
	credentials: AuthorizerCredential[],
): RentalEligibility {
	const claims = normalizeCredentials(credentials);
	const licenceValid =
		claims.mdlExpiryDate !== null &&
		new Date(claims.mdlExpiryDate) > new Date();
	const categoryMatch = claims.presentedCategories.includes(
		vehicle.requiredLicenceCategory,
	);

	if (!categoryMatch) {
		return {
			bookingApproved: false,
			minimumAge: vehicle.minimumDriverAge,
			minimumAgeMet: true,
			requiredLicenceCategory: vehicle.requiredLicenceCategory,
			presentedCategories: claims.presentedCategories,
			licenceValid,
			reasonCode: "licence_category_mismatch",
			reasonText: `Presented licence categories (${claims.presentedCategories.join(", ") || "none"}) do not include required category ${vehicle.requiredLicenceCategory}.`,
		};
	}

	if (!licenceValid) {
		return {
			bookingApproved: false,
			minimumAge: vehicle.minimumDriverAge,
			minimumAgeMet: true,
			requiredLicenceCategory: vehicle.requiredLicenceCategory,
			presentedCategories: claims.presentedCategories,
			licenceValid: false,
			reasonCode: "licence_expired",
			reasonText:
				"The presented mobile driving licence is expired or missing an expiry date.",
		};
	}

	return {
		bookingApproved: true,
		minimumAge: vehicle.minimumDriverAge,
		minimumAgeMet: true,
		requiredLicenceCategory: vehicle.requiredLicenceCategory,
		presentedCategories: claims.presentedCategories,
		licenceValid: true,
		reasonCode: "approved",
		reasonText: `Verified licence category ${vehicle.requiredLicenceCategory} and licence validity for ${vehicle.name}.`,
	};
}
