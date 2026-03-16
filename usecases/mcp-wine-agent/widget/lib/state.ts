import { CHECK_SVG, TERMINAL_STATUSES, X_SVG } from "./constants";
import type {
	VerificationResultViewModel,
	VerificationStatus,
	VerificationViewData,
} from "./types";

export function normalizeToolOutput(raw: unknown): VerificationViewData {
	if (!raw || typeof raw !== "object") {
		return {};
	}

	if (
		"structuredContent" in raw &&
		raw.structuredContent &&
		typeof raw.structuredContent === "object"
	) {
		return raw.structuredContent as VerificationViewData;
	}

	return raw as VerificationViewData;
}

export function isTerminalStatus(
	status: VerificationStatus | undefined,
): boolean {
	return status !== undefined && TERMINAL_STATUSES.has(status);
}

export function buildStatusText(data: VerificationViewData): string {
	const status = data.status;
	const lifecycle = data.verification?.lifecycle;

	if (status === "verified") {
		return "Verification complete. Continue in chat or finish payment below.";
	}

	if (status === "rejected") {
		return (
			data.verification?.lastError ??
			"Verification was rejected. You can restart checkout to try again."
		);
	}

	if (status === "expired") {
		return "Verification session expired. Restart checkout to generate a fresh QR code.";
	}

	if (status === "error") {
		return (
			data.verification?.lastError ??
			"Verification hit an error. Restart checkout to try again."
		);
	}

	if (status === "completed") {
		return "Checkout completed successfully.";
	}

	if (lifecycle === "authorized" || lifecycle === "completed") {
		return "Wallet consent received. Final verification checks are finishing now...";
	}

	if (lifecycle === "processing") {
		return "Wallet proof received. Finalizing age verification...";
	}

	if (lifecycle === "pending_wallet") {
		return "Waiting for wallet scan and consent.";
	}

	return "Scan the QR code with your wallet. This widget will keep checking automatically.";
}

export function buildInstructionText(data: VerificationViewData): string {
	const status = data.status;

	if (status === "verified") {
		return "Verification succeeded. The agent can continue in chat, or you can finish payment below.";
	}

	if (status === "completed") {
		return "Payment completed successfully.";
	}

	if (status === "rejected" || status === "expired" || status === "error") {
		return "This verification session ended. Restart checkout if you want to try again.";
	}

	return "Scan this QR code with your EUDI Wallet app. Your digital identity will be used only to verify age eligibility.";
}

export function buildVerificationResult(
	data: VerificationViewData,
): VerificationResultViewModel | null {
	const status = data.status;
	if (!status) {
		return null;
	}

	const isSuccess = status === "verified" || status === "completed";
	const isFailure =
		status === "rejected" || status === "expired" || status === "error";
	if (!isSuccess && !isFailure) {
		return null;
	}

	if (isSuccess) {
		const age = data.verification?.ageCheck;
		if (age?.actualAge) {
			return {
				className: "result-success",
				icon: CHECK_SVG,
				title: "Age Verified",
				detail: `Identity confirmed - age ${age.actualAge}, meets ${age.requiredAge}+ requirement.`,
			};
		}

		if (age?.requiredAge) {
			return {
				className: "result-success",
				icon: CHECK_SVG,
				title: "Age Verified",
				detail: `Identity confirmed - ${age.requiredAge}+ eligibility verified.`,
			};
		}

		return {
			className: "result-success",
			icon: CHECK_SVG,
			title: "Age Verified",
			detail: "Identity confirmed - eligible to purchase age-restricted wines.",
		};
	}

	if (status === "rejected") {
		const age = data.verification?.ageCheck;
		if (age && !age.eligible && age.actualAge != null) {
			return {
				className: "result-failure",
				icon: X_SVG,
				title: "Age Verification Failed",
				detail: `Buyer is ${age.actualAge} years old - minimum age is ${age.requiredAge}.`,
			};
		}

		return {
			className: "result-failure",
			icon: X_SVG,
			title: "Verification Rejected",
			detail:
				data.verification?.lastError ??
				"The verification was not accepted. Try again.",
		};
	}

	if (status === "expired") {
		return {
			className: "result-failure",
			icon: X_SVG,
			title: "Verification Expired",
			detail:
				"The session timed out before completion. Restart checkout to try again.",
		};
	}

	return {
		className: "result-failure",
		icon: X_SVG,
		title: "Verification Error",
		detail:
			data.verification?.lastError ??
			"Something went wrong. Restart checkout to try again.",
	};
}
