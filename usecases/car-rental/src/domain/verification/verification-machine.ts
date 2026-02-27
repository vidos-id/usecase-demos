import type { VerificationLifecycleState } from "@/domain/verification/verification-schemas";

const recoverableFailureStates: VerificationLifecycleState[] = [
	"rejected",
	"expired",
	"error",
];

const allowedTransitions: Record<
	VerificationLifecycleState,
	readonly VerificationLifecycleState[]
> = {
	created: ["pending_wallet", "error"],
	pending_wallet: ["processing", "success", "rejected", "expired", "error"],
	processing: ["success", "rejected", "expired", "error"],
	success: [],
	rejected: ["created"],
	expired: ["created"],
	error: ["created"],
};

export function canTransitionVerificationLifecycle(
	current: VerificationLifecycleState,
	next: VerificationLifecycleState,
): boolean {
	if (current === next) {
		return true;
	}

	return allowedTransitions[current].includes(next);
}

export function isRecoverableVerificationFailure(
	lifecycle: VerificationLifecycleState,
): boolean {
	return recoverableFailureStates.includes(lifecycle);
}
