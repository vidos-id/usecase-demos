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
		debugEmitters.auth.transitionApplied(
			scope,
			"pending",
			"authorized",
			"Authorization transitioned to authorized.",
		);
		await onAuthorized();
		return;
	}

	if (status === "expired") {
		debugEmitters.auth.transitionApplied(
			scope,
			"pending",
			"expired",
			"Authorization transitioned to expired.",
		);
		updateRequestToExpired(pendingRequest.id);
		return;
	}

	debugEmitters.auth.transitionApplied(
		scope,
		"pending",
		status,
		"Authorization transitioned to failure state.",
	);

	if (errorInfo) {
		debugEmitters.auth.transitionFailure(
			scope,
			"Authorization returned error details.",
			errorInfo,
		);
	}

	updateRequestToFailed(
		pendingRequest.id,
		errorInfo?.detail ?? DEFAULT_STATUS_MESSAGES[status],
		errorInfo,
		{ status },
	);
}
