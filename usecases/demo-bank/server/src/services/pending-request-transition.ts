import type { AuthorizationErrorInfo } from "demo-bank-shared/types/vidos-errors";
import {
	type PendingAuthRequest,
	updateRequestToExpired,
	updateRequestToFailed,
} from "../stores/pending-auth-requests";

type TransitionInput = {
	pendingRequest: PendingAuthRequest;
	status: "pending" | "authorized" | "rejected" | "error" | "expired";
	errorInfo?: AuthorizationErrorInfo;
	onAuthorized: () => Promise<void>;
};

const DEFAULT_STATUS_MESSAGES: Record<
	"rejected" | "error" | "expired",
	string
> = {
	rejected: "Verification was rejected.",
	error: "Verification failed.",
	expired: "Verification request expired.",
};

export async function applyPendingRequestTransition(
	input: TransitionInput,
): Promise<void> {
	const { pendingRequest, status, errorInfo, onAuthorized } = input;

	if (status === "pending") {
		return;
	}

	if (status === "authorized") {
		await onAuthorized();
		return;
	}

	if (status === "expired") {
		updateRequestToExpired(pendingRequest.id);
		return;
	}

	updateRequestToFailed(
		pendingRequest.id,
		errorInfo?.detail ?? DEFAULT_STATUS_MESSAGES[status],
		errorInfo,
		{ status },
	);
}
