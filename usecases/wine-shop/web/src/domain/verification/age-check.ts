import type {
	AgeCheckResult,
	NormalizedPidClaims,
} from "@/domain/verification/verification-types";

function computeAge(birthDateStr: string): number | null {
	const birthDate = new Date(birthDateStr);
	if (Number.isNaN(birthDate.getTime())) return null;

	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && today.getDate() < birthDate.getDate())
	) {
		age--;
	}
	return age;
}

export function checkAgeEligibility(
	disclosedClaims: NormalizedPidClaims | null,
	requiredAge: number,
	destinationLabel: string,
): AgeCheckResult {
	if (!disclosedClaims) {
		return {
			eligible: false,
			requiredAge,
			actualAge: null,
			birthDate: null,
			destination: destinationLabel,
		};
	}

	const ageKey = String(requiredAge);
	const ageAttestation = disclosedClaims.ageEqualOrOver?.[ageKey];
	if (typeof ageAttestation === "boolean") {
		return {
			eligible: ageAttestation,
			requiredAge,
			actualAge: disclosedClaims.ageInYears ?? null,
			birthDate: disclosedClaims.birthDate ?? null,
			destination: destinationLabel,
		};
	}

	if (disclosedClaims.ageInYears !== undefined) {
		return {
			eligible: disclosedClaims.ageInYears >= requiredAge,
			requiredAge,
			actualAge: disclosedClaims.ageInYears,
			birthDate: disclosedClaims.birthDate ?? null,
			destination: destinationLabel,
		};
	}

	if (!disclosedClaims.birthDate) {
		return {
			eligible: false,
			requiredAge,
			actualAge: null,
			birthDate: null,
			destination: destinationLabel,
		};
	}

	const actualAge = computeAge(disclosedClaims.birthDate);

	return {
		eligible: actualAge !== null && actualAge >= requiredAge,
		requiredAge,
		actualAge,
		birthDate: disclosedClaims.birthDate,
		destination: destinationLabel,
	};
}
