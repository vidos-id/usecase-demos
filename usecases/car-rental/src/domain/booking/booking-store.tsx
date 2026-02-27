import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	confirmLocalPayment,
	createCompletionHandoff,
	createInitialBookingState,
	createVerificationBookingContext,
	getMissingVerificationFields,
	transitionBookingState,
} from "@/domain/booking/booking-machine";
import type {
	BookingLifecycleStatus,
	BookingLocation,
	BookingState,
	BookingTransitionResult,
	BookingVehicle,
} from "@/domain/booking/booking-types";
import type { VerificationState } from "@/domain/verification/verification-schemas";

type BookingStoreValue = {
	state: BookingState;
	setLocation: (location: BookingLocation | null) => void;
	setPickupDateTime: (pickupDateTime: string | null) => void;
	setDropoffDateTime: (dropoffDateTime: string | null) => void;
	selectVehicle: (vehicle: BookingVehicle | null) => void;
	transitionTo: (nextStatus: BookingLifecycleStatus) => BookingTransitionResult;
	markReviewed: () => BookingTransitionResult;
	handoffToVerification: () => BookingTransitionResult;
	confirmMockPayment: (
		verification: VerificationState,
	) => BookingTransitionResult;
	handoffToCompletion: (
		verification: VerificationState,
	) => BookingTransitionResult;
	rewindToStep: (step: "search" | "select" | "review" | "verify") => void;
	resetBooking: () => void;
	missingForVerification: ReturnType<typeof getMissingVerificationFields>;
	wasHydrationReset: boolean;
};

const BookingStoreContext = createContext<BookingStoreValue | null>(null);

function createBookingId(): string {
	return `book_${crypto.randomUUID()}`;
}

export function BookingStoreProvider({ children }: PropsWithChildren) {
	const [state, setState] = useState<BookingState>(createInitialBookingState());
	const stateRef = useRef(state);

	useEffect(() => {
		stateRef.current = state;
	}, [state]);

	const value = useMemo<BookingStoreValue>(() => {
		const applyState = (renderer: (current: BookingState) => BookingState) => {
			const nextState = renderer(stateRef.current);
			stateRef.current = nextState;
			setState(nextState);
		};

		return {
			state,
			setLocation: (location) => {
				applyState((current) => ({
					...current,
					rentalDetails: {
						...current.rentalDetails,
						location,
					},
					lastError: null,
					updatedAt: new Date().toISOString(),
				}));
			},
			setPickupDateTime: (pickupDateTime) => {
				applyState((current) => ({
					...current,
					rentalDetails: {
						...current.rentalDetails,
						pickupDateTime,
					},
					lastError: null,
					updatedAt: new Date().toISOString(),
				}));
			},
			setDropoffDateTime: (dropoffDateTime) => {
				applyState((current) => ({
					...current,
					rentalDetails: {
						...current.rentalDetails,
						dropoffDateTime,
					},
					lastError: null,
					updatedAt: new Date().toISOString(),
				}));
			},
			selectVehicle: (selectedVehicle) => {
				applyState((current) => ({
					...current,
					rentalDetails: {
						...current.rentalDetails,
						selectedVehicle,
					},
					lastError: null,
					updatedAt: new Date().toISOString(),
				}));
			},
			transitionTo: (nextStatus) => {
				const result = transitionBookingState(stateRef.current, nextStatus);
				stateRef.current = result.state;
				setState(result.state);
				return result;
			},
			markReviewed: () => {
				const result = transitionBookingState(stateRef.current, "reviewed");
				stateRef.current = result.state;
				setState(result.state);
				return result;
			},
			handoffToVerification: () => {
				const result = createVerificationBookingContext(
					stateRef.current,
					createBookingId,
				);
				stateRef.current = result.state;
				setState(result.state);
				return result;
			},
			confirmMockPayment: (verification) => {
				const canConfirmFromVerification = verification.lifecycle === "success";

				if (!canConfirmFromVerification) {
					const nextState = {
						...stateRef.current,
						lastError: "Verification must succeed before payment confirmation",
						updatedAt: new Date().toISOString(),
					};
					stateRef.current = nextState;
					setState(nextState);
					return {
						ok: false,
						error: "Verification must succeed before payment confirmation",
						state: nextState,
					};
				}

				if (
					stateRef.current.bookingId &&
					verification.bookingId &&
					stateRef.current.bookingId !== verification.bookingId
				) {
					const nextState = {
						...stateRef.current,
						lastError: "Verification booking mismatch",
						updatedAt: new Date().toISOString(),
					};
					stateRef.current = nextState;
					setState(nextState);
					return {
						ok: false,
						error: "Verification booking mismatch",
						state: nextState,
					};
				}

				const result = confirmLocalPayment(stateRef.current);
				stateRef.current = result.state;
				setState(result.state);
				return result;
			},
			handoffToCompletion: (verification) => {
				const result = createCompletionHandoff(stateRef.current, {
					policy: verification.policy,
					disclosedClaims: verification.disclosedClaims,
				});
				stateRef.current = result.state;
				setState(result.state);
				return result;
			},
			resetBooking: () => {
				const resetState = createInitialBookingState();
				stateRef.current = resetState;
				setState(resetState);
			},
			rewindToStep: (step) => {
				applyState((current) => {
					const now = new Date().toISOString();
					if (step === "search") {
						return createInitialBookingState();
					}

					if (step === "select") {
						return {
							...createInitialBookingState(),
							rentalDetails: {
								...createInitialBookingState().rentalDetails,
								location: current.rentalDetails.location,
								pickupDateTime: current.rentalDetails.pickupDateTime,
								dropoffDateTime: current.rentalDetails.dropoffDateTime,
								selectedVehicle: null,
							},
							updatedAt: now,
						};
					}

					if (step === "review") {
						return {
							...createInitialBookingState(),
							status: "reviewed",
							rentalDetails: {
								...current.rentalDetails,
							},
							updatedAt: now,
						};
					}

					return {
						...current,
						status: "awaiting_verification",
						confirmation: null,
						lastError: null,
						updatedAt: now,
					};
				});
			},
			missingForVerification: getMissingVerificationFields(state.rentalDetails),
			wasHydrationReset: false,
		};
	}, [state]);

	return (
		<BookingStoreContext.Provider value={value}>
			{children}
		</BookingStoreContext.Provider>
	);
}

export function useBookingStore(): BookingStoreValue {
	const store = useContext(BookingStoreContext);
	if (!store) {
		throw new Error("useBookingStore must be used inside BookingStoreProvider");
	}

	return store;
}
