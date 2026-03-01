import type {
	OrderLifecycleStatus,
	OrderState,
	OrderTransitionResult,
} from "@/domain/order/order-types";
import type { AgeVerificationMethod } from "@/domain/verification/verification-types";

const allowedTransitions: Record<OrderLifecycleStatus, OrderLifecycleStatus[]> =
	{
		draft: ["reviewed", "failed"],
		reviewed: ["draft", "awaiting_verification", "failed"],
		awaiting_verification: ["verified", "failed"],
		verified: ["payment_confirmed", "failed"],
		payment_confirmed: ["completed", "failed"],
		completed: [],
		failed: ["draft"],
	};

export function createInitialOrderState(): OrderState {
	return {
		status: "draft",
		orderId: null,
		items: [],
		shippingDestination: null,
		ageVerificationMethod: "age_equal_or_over",
		confirmation: null,
		updatedAt: new Date().toISOString(),
		lastError: null,
	};
}

export function setOrderAgeVerificationMethod(
	state: OrderState,
	method: AgeVerificationMethod,
): OrderTransitionResult {
	return {
		ok: true,
		state: {
			...state,
			ageVerificationMethod: method,
			lastError: null,
			updatedAt: new Date().toISOString(),
		},
	};
}

export function canTransitionOrder(
	current: OrderLifecycleStatus,
	next: OrderLifecycleStatus,
): boolean {
	if (current === next) return true;
	return allowedTransitions[current].includes(next);
}

export function transitionOrderState(
	state: OrderState,
	nextStatus: OrderLifecycleStatus,
): OrderTransitionResult {
	if (state.status === nextStatus) {
		return { ok: true, state };
	}

	if (!canTransitionOrder(state.status, nextStatus)) {
		return {
			ok: false,
			error: `Transition not allowed: ${state.status} -> ${nextStatus}`,
			state: {
				...state,
				lastError: `Transition not allowed: ${state.status} -> ${nextStatus}`,
				updatedAt: new Date().toISOString(),
			},
		};
	}

	return {
		ok: true,
		state: {
			...state,
			status: nextStatus,
			lastError: null,
			updatedAt: new Date().toISOString(),
		},
	};
}
