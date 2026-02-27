import {
	type BookingConfirmationPayload,
	createBookingConfirmationPayload,
} from "@/domain/booking/booking-confirmation";
import {
	BOOKING_REQUIRED_FIELDS,
	type BookingLifecycleStatus,
	type BookingRentalDetails,
	type BookingState,
	type BookingTransitionResult,
	type BookingValidationKey,
} from "@/domain/booking/booking-types";

const allowedTransitions: Record<
	BookingLifecycleStatus,
	BookingLifecycleStatus[]
> = {
	draft: ["reviewed", "failed"],
	reviewed: ["draft", "awaiting_verification", "failed"],
	awaiting_verification: ["verified", "failed"],
	verified: ["payment_confirmed", "failed"],
	payment_confirmed: ["completed", "failed"],
	completed: [],
	failed: ["draft"],
};

export function createInitialBookingState(): BookingState {
	return {
		status: "draft",
		bookingId: null,
		rentalDetails: {
			location: null,
			pickupDateTime: null,
			dropoffDateTime: null,
			selectedVehicle: null,
		},
		confirmation: null,
		updatedAt: new Date().toISOString(),
		lastError: null,
	};
}

export function getMissingVerificationFields(
	rentalDetails: BookingRentalDetails,
): BookingValidationKey[] {
	return BOOKING_REQUIRED_FIELDS.filter((field) => !rentalDetails[field]);
}

export function transitionBookingState(
	state: BookingState,
	nextStatus: BookingLifecycleStatus,
): BookingTransitionResult {
	if (state.status === nextStatus) {
		return { ok: true, state };
	}

	const nextStates = allowedTransitions[state.status];
	if (!nextStates.includes(nextStatus)) {
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

	if (nextStatus === "awaiting_verification") {
		const missing = getMissingVerificationFields(state.rentalDetails);
		if (missing.length > 0) {
			return {
				ok: false,
				error: `Missing required booking data: ${missing.join(", ")}`,
				state: {
					...state,
					lastError: `Missing required booking data: ${missing.join(", ")}`,
					updatedAt: new Date().toISOString(),
				},
			};
		}

		if (!state.bookingId) {
			return {
				ok: false,
				error: "Missing bookingId for verification handoff",
				state: {
					...state,
					lastError: "Missing bookingId for verification handoff",
					updatedAt: new Date().toISOString(),
				},
			};
		}
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

export function createVerificationBookingContext(
	state: BookingState,
	idFactory: () => string,
): BookingTransitionResult {
	const missing = getMissingVerificationFields(state.rentalDetails);
	if (missing.length > 0) {
		return {
			ok: false,
			error: `Missing required booking data: ${missing.join(", ")}`,
			state: {
				...state,
				lastError: `Missing required booking data: ${missing.join(", ")}`,
				updatedAt: new Date().toISOString(),
			},
		};
	}

	const withBookingId: BookingState = {
		...state,
		bookingId: state.bookingId ?? idFactory(),
		lastError: null,
		updatedAt: new Date().toISOString(),
	};

	const reviewReadyState: BookingState =
		withBookingId.status === "draft"
			? {
					...withBookingId,
					status: "reviewed",
				}
			: withBookingId;

	return transitionBookingState(reviewReadyState, "awaiting_verification");
}

export function createCompletionHandoff(
	state: BookingState,
	input: {
		policy: Parameters<typeof createBookingConfirmationPayload>[0]["policy"];
		disclosedClaims: Parameters<
			typeof createBookingConfirmationPayload
		>[0]["disclosedClaims"];
		now?: string;
	},
): BookingTransitionResult {
	if (state.status !== "payment_confirmed") {
		return {
			ok: false,
			error: "Booking must be payment_confirmed before completion handoff",
			state: {
				...state,
				lastError:
					"Booking must be payment_confirmed before completion handoff",
				updatedAt: new Date().toISOString(),
			},
		};
	}

	if (!state.bookingId) {
		return {
			ok: false,
			error: "Missing bookingId for completion handoff",
			state: {
				...state,
				lastError: "Missing bookingId for completion handoff",
				updatedAt: new Date().toISOString(),
			},
		};
	}

	const locationName = state.rentalDetails.location?.name;
	if (!locationName) {
		return {
			ok: false,
			error: "Missing pickup location for completion handoff",
			state: {
				...state,
				lastError: "Missing pickup location for completion handoff",
				updatedAt: new Date().toISOString(),
			},
		};
	}

	const bookingReference = state.bookingId;
	const completionResult = transitionBookingState(state, "completed");
	if (!completionResult.ok) {
		return completionResult;
	}

	const confirmation: BookingConfirmationPayload =
		createBookingConfirmationPayload({
			bookingReference,
			locationCode: state.rentalDetails.location?.code,
			locationName,
			policy: input.policy,
			disclosedClaims: input.disclosedClaims,
			now: input.now,
		});

	return {
		ok: true,
		state: {
			...completionResult.state,
			confirmation,
			updatedAt: input.now ?? new Date().toISOString(),
		},
	};
}

export function confirmLocalPayment(
	state: BookingState,
): BookingTransitionResult {
	let nextState = state;

	if (nextState.status === "awaiting_verification") {
		const verifiedResult = transitionBookingState(nextState, "verified");
		if (!verifiedResult.ok) {
			return verifiedResult;
		}
		nextState = verifiedResult.state;
	}

	if (nextState.status === "payment_confirmed") {
		return {
			ok: true,
			state: nextState,
		};
	}

	return transitionBookingState(nextState, "payment_confirmed");
}
