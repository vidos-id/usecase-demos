import type { AuthorizerCredential } from "@/domain/verification/authorizer-client";
import type {
	NormalizedPidClaims,
	VerificationLifecycleState,
	VerificationPolicy,
} from "@/domain/verification/verification-types";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
	if (!value || typeof value !== "object") return null;
	return value as RecordValue;
}

function pickString(
	record: RecordValue,
	keys: readonly string[],
): string | undefined {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string" && value.length > 0) return value;
	}
	return undefined;
}

function pickNumber(
	record: RecordValue,
	keys: readonly string[],
): number | undefined {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (typeof value === "string") {
			const parsed = Number(value);
			if (Number.isFinite(parsed)) return parsed;
		}
	}
	return undefined;
}

function normalizeAgeEqualOrOver(
	claims: RecordValue,
): Record<string, boolean> | undefined {
	const raw = claims["age_equal_or_over"];
	const node = asRecord(raw);
	if (!node) return undefined;

	const entries = Object.entries(node).flatMap(([key, value]) => {
		if (typeof value === "boolean") return [[key, value] as const];
		if (typeof value === "string") {
			if (value === "true") return [[key, true] as const];
			if (value === "false") return [[key, false] as const];
		}
		return [];
	});

	if (entries.length === 0) return undefined;
	return Object.fromEntries(entries);
}

export function mapAuthorizerStatusToVerificationLifecycle(
	status:
		| "created"
		| "pending"
		| "authorized"
		| "rejected"
		| "expired"
		| "error",
): VerificationLifecycleState {
	if (status === "created") return "pending_wallet";
	if (status === "pending") return "processing";
	if (status === "authorized") return "success";
	return status;
}

export function normalizePolicyResult(raw: unknown): VerificationPolicy {
	if (!Array.isArray(raw)) {
		return { overallStatus: "unknown", checks: [] };
	}

	const checks = raw.map((entry, index) => {
		const item = asRecord(entry);
		if (!item) {
			return { id: `policy_${index}`, status: "unknown" as const, path: [] };
		}

		const error = asRecord(item.error);
		const errorMessage = error
			? pickString(error, ["detail", "title", "type"])
			: undefined;
		const status = error ? ("fail" as const) : ("pass" as const);

		return {
			id:
				typeof item.policy === "string" && item.policy.length > 0
					? item.policy
					: `policy_${index}`,
			status,
			message: errorMessage,
			path: Array.isArray(item.path)
				? item.path.filter(
						(p): p is string | number =>
							typeof p === "string" || typeof p === "number",
					)
				: [],
		};
	});

	const hasFailedCheck = checks.some((c) => c.status === "fail");
	const overallStatus =
		checks.length === 0 ? "unknown" : hasFailedCheck ? "fail" : "pass";

	return { overallStatus, checks };
}

export function normalizeDisclosedClaims(
	credentials: AuthorizerCredential[],
): NormalizedPidClaims {
	for (const credential of credentials) {
		const claims = asRecord(credential.claims);
		if (!claims) continue;

		const givenName = pickString(claims, ["given_name", "givenName"]);
		const familyName = pickString(claims, ["family_name", "familyName"]);
		const birthDate = pickString(claims, [
			"birth_date",
			"birthdate",
			"birthDate",
		]);
		const portrait = pickString(claims, ["portrait", "picture"]);
		const ageInYears = pickNumber(claims, ["age_in_years", "ageInYears"]);
		const ageEqualOrOver = normalizeAgeEqualOrOver(claims);

		if (
			givenName ||
			familyName ||
			birthDate ||
			portrait ||
			ageInYears !== undefined ||
			ageEqualOrOver
		) {
			return {
				givenName,
				familyName,
				birthDate,
				portrait,
				ageInYears,
				ageEqualOrOver,
			};
		}
	}

	return {};
}
