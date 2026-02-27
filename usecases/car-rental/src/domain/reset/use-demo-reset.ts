import { useCallback } from "react";
import { useBookingStore } from "@/domain/booking/booking-store";
import { useVerificationStore } from "@/domain/verification/verification-store";

export function useDemoReset(): () => void {
	const { resetBooking } = useBookingStore();
	const { resetVerification } = useVerificationStore();

	return useCallback(() => {
		resetBooking();
		resetVerification();
	}, [resetBooking, resetVerification]);
}
