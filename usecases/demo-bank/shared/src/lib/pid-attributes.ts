/**
 * PID Attribute Mappings for SD-JWT and mDoc formats.
 * Based on EUDI PID Rulebook specifications.
 *
 * The paths differ between formats:
 * - SD-JWT: Flat JSON paths (e.g., ["family_name"])
 * - mDoc: Namespace-prefixed paths (e.g., ["eu.europa.ec.eudi.pid.1", "family_name"])
 */

export interface PIDAttributeMapping {
	/** Canonical attribute ID used throughout the application */
	id: string;
	/** Human-readable display name */
	displayName: string;
	/** Whether this attribute is required for credential issuance */
	requiredForIssuance?: boolean;
	/** Path for mDoc format (within namespace) */
	mdocPath: string[];
	/** Path for SD-JWT format */
	sdJwtPath: string[];
}

/**
 * Complete PID attribute mappings covering all standard EUDI PID attributes.
 * Supports both SD-JWT VC and ISO mDoc credential formats.
 */
export const PID_ATTRIBUTE_MAPPINGS: PIDAttributeMapping[] = [
	// Required attributes
	{
		id: "family_name",
		displayName: "Family Name",
		requiredForIssuance: true,
		mdocPath: ["family_name"],
		sdJwtPath: ["family_name"],
	},
	{
		id: "given_name",
		displayName: "Given Name",
		requiredForIssuance: true,
		mdocPath: ["given_name"],
		sdJwtPath: ["given_name"],
	},
	{
		id: "birth_date",
		displayName: "Date of Birth",
		requiredForIssuance: true,
		mdocPath: ["birth_date"],
		sdJwtPath: ["birthdate"],
	},
	{
		id: "age_over_18",
		displayName: "Age Over 18",
		mdocPath: ["age_over_18"],
		sdJwtPath: ["age_equal_or_over", "18"],
	},
	{
		id: "age_in_years",
		displayName: "Age in Years",
		mdocPath: ["age_in_years"],
		sdJwtPath: ["age_in_years"],
	},
	{
		id: "age_birth_year",
		displayName: "Birth Year",
		mdocPath: ["age_birth_year"],
		sdJwtPath: ["age_birth_year"],
	},
	{
		id: "family_name_birth",
		displayName: "Family Name at Birth",
		mdocPath: ["family_name_birth"],
		sdJwtPath: ["birth_family_name"],
	},
	{
		id: "given_name_birth",
		displayName: "Given Name at Birth",
		mdocPath: ["given_name_birth"],
		sdJwtPath: ["birth_given_name"],
	},
	{
		id: "birth_place",
		displayName: "Place of Birth",
		mdocPath: ["place_of_birth"],
		sdJwtPath: ["place_of_birth"],
	},
	{
		id: "resident_address",
		displayName: "Resident Address",
		mdocPath: ["resident_address"],
		sdJwtPath: ["address", "formatted"],
	},
	{
		id: "resident_country",
		displayName: "Resident Country",
		mdocPath: ["resident_country"],
		sdJwtPath: ["address", "country"],
	},
	{
		id: "resident_state",
		displayName: "Resident State",
		mdocPath: ["resident_state"],
		sdJwtPath: ["address", "region"],
	},
	{
		id: "resident_city",
		displayName: "Resident City",
		mdocPath: ["resident_city"],
		sdJwtPath: ["address", "locality"],
	},
	{
		id: "resident_postal_code",
		displayName: "Resident Postal Code",
		mdocPath: ["resident_postal_code"],
		sdJwtPath: ["address", "postal_code"],
	},
	{
		id: "resident_street",
		displayName: "Resident Street",
		mdocPath: ["resident_street"],
		sdJwtPath: ["address", "street_address"],
	},
	{
		id: "resident_house_number",
		displayName: "Resident House Number",
		mdocPath: ["resident_house_number"],
		sdJwtPath: ["address", "house_number"],
	},
	{
		id: "sex",
		displayName: "Sex",
		mdocPath: ["sex"],
		sdJwtPath: ["sex"],
	},
	{
		id: "nationality",
		displayName: "Nationality",
		mdocPath: ["nationality"],
		sdJwtPath: ["nationalities"],
	},
	{
		id: "issuance_date",
		displayName: "Issuance Date",
		mdocPath: ["issuance_date"],
		sdJwtPath: ["date_of_issuance"],
	},
	{
		id: "expiry_date",
		displayName: "Expiry Date",
		mdocPath: ["expiry_date"],
		sdJwtPath: ["date_of_expiry"],
	},
	{
		id: "issuing_authority",
		displayName: "Issuing Authority",
		mdocPath: ["issuing_authority"],
		sdJwtPath: ["issuing_authority"],
	},
	{
		id: "document_number",
		displayName: "Document Number",
		mdocPath: ["document_number"],
		sdJwtPath: ["document_number"],
	},
	{
		id: "personal_administrative_number",
		displayName: "Personal Administrative Number",
		mdocPath: ["personal_administrative_number"],
		sdJwtPath: ["personal_administrative_number"],
	},
	{
		id: "issuing_jurisdiction",
		displayName: "Issuing Jurisdiction",
		mdocPath: ["issuing_jurisdiction"],
		sdJwtPath: ["issuing_jurisdiction"],
	},
	{
		id: "issuing_country",
		displayName: "Issuing Country",
		mdocPath: ["issuing_country"],
		sdJwtPath: ["issuing_country"],
	},
	{
		id: "portrait",
		displayName: "Portrait",
		mdocPath: ["portrait"],
		sdJwtPath: ["picture"],
	},
	{
		id: "email_address",
		displayName: "Email Address",
		mdocPath: ["email_address"],
		sdJwtPath: ["email"],
	},
	{
		id: "mobile_phone_number",
		displayName: "Mobile Phone Number",
		mdocPath: ["mobile_phone_number"],
		sdJwtPath: ["phone_number"],
	},
];

/** mDoc namespace for EUDI PID credentials */
export const PID_MDOC_NAMESPACE = "eu.europa.ec.eudi.pid.1";

/** SD-JWT VCT (Verifiable Credential Type) for EUDI PID */
export const PID_SDJWT_VCT = "urn:eudi:pid:1";

/** mDoc doctype for EUDI PID */
export const PID_MDOC_DOCTYPE = "eu.europa.ec.eudi.pid.1";

/**
 * Get attribute mapping by canonical ID
 */
export function getAttributeById(id: string): PIDAttributeMapping | undefined {
	return PID_ATTRIBUTE_MAPPINGS.find((attr) => attr.id === id);
}

/**
 * Get attribute mapping by SD-JWT path (first element)
 */
export function getAttributeBySdJwtPath(
	path: string[],
): PIDAttributeMapping | undefined {
	return PID_ATTRIBUTE_MAPPINGS.find(
		(attr) =>
			attr.sdJwtPath.length === path.length &&
			attr.sdJwtPath.every((p, i) => p === path[i]),
	);
}

/**
 * Get attribute mapping by mDoc path (without namespace)
 */
export function getAttributeByMdocPath(
	path: string[],
): PIDAttributeMapping | undefined {
	return PID_ATTRIBUTE_MAPPINGS.find(
		(attr) =>
			attr.mdocPath.length === path.length &&
			attr.mdocPath.every((p, i) => p === path[i]),
	);
}

/**
 * Build a map from canonical ID to display name
 */
export function buildClaimLabels(): Record<string, string> {
	const labels: Record<string, string> = {};
	for (const attr of PID_ATTRIBUTE_MAPPINGS) {
		labels[attr.id] = attr.displayName;
	}
	return labels;
}
