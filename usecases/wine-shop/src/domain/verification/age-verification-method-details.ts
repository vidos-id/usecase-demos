import type { AgeVerificationMethod } from "@/domain/verification/verification-types";

function formatIsoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function getBirthdateThreshold(requiredAge: number, now = new Date()): string {
	const threshold = new Date(now);
	threshold.setFullYear(threshold.getFullYear() - requiredAge);
	return formatIsoDate(threshold);
}

export type AgeMethodTechnicalDetails = {
	pidField: string;
	claimPath: string;
	valueShape: string;
	acceptanceRule: string;
	exampleAcceptedValue: string;
};

export function getAgeMethodTechnicalDetails(
	method: AgeVerificationMethod,
	requiredAge: number,
): AgeMethodTechnicalDetails {
	switch (method) {
		case "age_equal_or_over":
			return {
				pidField: `age_equal_or_over.${requiredAge}`,
				claimPath: `["age_equal_or_over", "${requiredAge}"]`,
				valueShape: "boolean",
				acceptanceRule: "Value must be true",
				exampleAcceptedValue: "true",
			};
		case "age_in_years":
			return {
				pidField: "age_in_years",
				claimPath: `["age_in_years"]`,
				valueShape: "number",
				acceptanceRule: `Value must be greater than or equal to ${requiredAge}`,
				exampleAcceptedValue: String(requiredAge),
			};
		case "birthdate": {
			const threshold = getBirthdateThreshold(requiredAge);
			return {
				pidField: "birthdate",
				claimPath: `["birthdate"]`,
				valueShape: "ISO date string (YYYY-MM-DD)",
				acceptanceRule: `Date must be on or before ${threshold}`,
				exampleAcceptedValue: threshold,
			};
		}
	}
}
