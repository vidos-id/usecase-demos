import type { AuthorizationErrorInfo } from "shared/types/vidos-errors";
import { debugEmitters } from "../lib/debug-events";
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

	const scope = {
		requestId: pendingRequest.id,
		flowType: pendingRequest.type,
	};

	if (status === "authorized") {
		await onAuthorized();
		return;
	}

	if (status === "expired") {
		updateRequestToExpired(pendingRequest.id);
		return;
	}

	if (errorInfo) {
		debugEmitters.error(
			scope,
			"Authorization returned error details.",
			"authorization_error_detail",
			errorInfo as Record<string, unknown>,
		);
	}

	updateRequestToFailed(
		pendingRequest.id,
		errorInfo?.detail ?? DEFAULT_STATUS_MESSAGES[status],
		errorInfo,
		{ status },
	);
}
