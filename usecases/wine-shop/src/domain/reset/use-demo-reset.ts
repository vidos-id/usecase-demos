import { useCallback } from "react";
import { useOrderStore } from "@/domain/order/order-store";
import { useVerificationStore } from "@/domain/verification/verification-store";

export function useDemoReset(): () => void {
	const { resetOrder } = useOrderStore();
	const { resetVerification } = useVerificationStore();

	return useCallback(() => {
		resetOrder();
		resetVerification();
	}, [resetOrder, resetVerification]);
}
