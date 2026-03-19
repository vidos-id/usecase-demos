import type {
	AgeVerificationMethod,
	NormalizedPidClaims,
} from "@/domain/verification/verification-types";

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

export type AgeMethodEvaluationDetails = {
	expectedValue: string;
	receivedValue: string;
	fulfilled: boolean;
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

function compareIsoDates(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

export function getAgeMethodEvaluationDetails(
	method: AgeVerificationMethod,
	requiredAge: number,
	claims: NormalizedPidClaims | null,
): AgeMethodEvaluationDetails {
	if (!claims) {
		return {
			expectedValue: getAgeMethodTechnicalDetails(method, requiredAge)
				.acceptanceRule,
			receivedValue: "Not disclosed",
			fulfilled: false,
		};
	}

	switch (method) {
		case "age_equal_or_over": {
			const value = claims.ageEqualOrOver?.[String(requiredAge)];
			return {
				expectedValue: "true",
				receivedValue:
					typeof value === "boolean" ? String(value) : "Not disclosed",
				fulfilled: value === true,
			};
		}
		case "age_in_years": {
			const value = claims.ageInYears;
			return {
				expectedValue: `>= ${requiredAge}`,
				receivedValue:
					typeof value === "number" ? String(value) : "Not disclosed",
				fulfilled: typeof value === "number" && value >= requiredAge,
			};
		}
		case "birthdate": {
			const value = claims.birthDate;
			const threshold = getBirthdateThreshold(requiredAge);
			const fulfilled =
				typeof value === "string" &&
				/^\d{4}-\d{2}-\d{2}$/.test(value) &&
				compareIsoDates(value, threshold) <= 0;
			return {
				expectedValue: `<= ${threshold}`,
				receivedValue: typeof value === "string" ? value : "Not disclosed",
				fulfilled,
			};
		}
	}
}
