import {
	MDL_CREDENTIAL_ID,
	PID_CREDENTIAL_ID,
} from "@/domain/verification/verification-constants";
import type {
	NormalizedDisclosedClaims,
	VerificationLifecycleState,
	VerificationPolicy,
} from "@/domain/verification/verification-schemas";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	return value as RecordValue;
}

function pickString(
	record: RecordValue,
	keys: readonly string[],
): string | undefined {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string" && value.length > 0) {
			return value;
		}
	}

	return undefined;
}

function mapCredentialDataById(raw: unknown): {
	mdl: RecordValue;
	pid: RecordValue | null;
} {
	const source = asRecord(raw);
	if (!source) {
		return { mdl: {}, pid: null };
	}

	const directMdl = asRecord(source[MDL_CREDENTIAL_ID]);
	const directPid = asRecord(source[PID_CREDENTIAL_ID]);
	if (directMdl || directPid) {
		return {
			mdl: directMdl ?? {},
			pid: directPid,
		};
	}

	if (Array.isArray(source.credentials)) {
		const byId: Record<string, RecordValue> = {};
		for (const entry of source.credentials) {
			const item = asRecord(entry);
			if (!item) {
				continue;
			}

			const id = pickString(item, ["id", "credential_id", "credentialId"]);
			if (!id) {
				continue;
			}

			const disclosed =
				asRecord(item.disclosed) ??
				asRecord(item.claims) ??
				asRecord(item.credentialSubject) ??
				item;

			byId[id] = disclosed;
		}

		return {
			mdl: byId[MDL_CREDENTIAL_ID] ?? {},
			pid: byId[PID_CREDENTIAL_ID] ?? null,
		};
	}

	return {
		mdl: source,
		pid: asRecord(source.pid),
	};
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
	if (status === "created") {
		return "pending_wallet";
	}

	if (status === "pending") {
		return "processing";
	}

	if (status === "authorized") {
		return "success";
	}

	return status;
}

export function normalizePolicyResult(raw: unknown): VerificationPolicy {
	if (!Array.isArray(raw)) {
		return { overallStatus: "unknown", checks: [] };
	}

	const checks = raw.map((entry, index) => {
		const item = asRecord(entry);
		if (!item) {
			return {
				id: `policy_${index}`,
				status: "unknown" as const,
				path: [],
			};
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
						(pathEntry): pathEntry is string | number =>
							typeof pathEntry === "string" || typeof pathEntry === "number",
					)
				: [],
		};
	});

	const hasFailedCheck = checks.some((check) => check.status === "fail");
	const overallStatus =
		checks.length === 0 ? "unknown" : hasFailedCheck ? "fail" : "pass";

	return {
		overallStatus,
		checks,
	};
}

export function normalizeDisclosedClaims(
	raw: unknown,
): NormalizedDisclosedClaims {
	const credentialData = mapCredentialDataById(raw);
	const mdlSource = credentialData.mdl;

	const mdl: NormalizedDisclosedClaims["mdl"] = {
		givenName: pickString(mdlSource, ["given_name", "givenName"]),
		familyName: pickString(mdlSource, ["family_name", "familyName"]),
		birthDate: pickString(mdlSource, ["birth_date", "birthdate", "birthDate"]),
		documentNumber: pickString(mdlSource, [
			"document_number",
			"licence_number",
			"documentNumber",
		]),
		issuingCountry: pickString(mdlSource, [
			"issuing_country",
			"issuingCountry",
		]),
		issuingAuthority: pickString(mdlSource, [
			"issuing_authority",
			"issuingAuthority",
		]),
		expiryDate: pickString(mdlSource, ["expiry_date", "expiryDate"]),
		drivingPrivileges: Array.isArray(mdlSource.driving_privileges)
			? mdlSource.driving_privileges
			: Array.isArray(mdlSource.drivingPrivileges)
				? mdlSource.drivingPrivileges
				: undefined,
		portrait: pickString(mdlSource, ["portrait", "picture"]),
	};

	const pidCandidate = credentialData.pid;
	const pid = pidCandidate
		? {
				givenName: pickString(pidCandidate, ["given_name", "givenName"]),
				familyName: pickString(pidCandidate, ["family_name", "familyName"]),
				birthDate: pickString(pidCandidate, [
					"birth_date",
					"birthdate",
					"birthDate",
				]),
				personalAdministrativeNumber: pickString(pidCandidate, [
					"personal_administrative_number",
					"personalAdministrativeNumber",
				]),
			}
		: undefined;

	return {
		mdl,
		pid,
	};
}
