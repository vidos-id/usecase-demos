import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { ShippingDestination } from "@/data/shipping-destinations";
import type { CartItem, WineProduct } from "@/domain/catalog/catalog-types";
import {
	createInitialOrderState,
	setOrderAgeVerificationMethod,
	transitionOrderState,
} from "@/domain/order/order-machine";
import type {
	OrderConfirmation,
	OrderLifecycleStatus,
	OrderState,
	OrderTransitionResult,
} from "@/domain/order/order-types";
import type {
	AgeVerificationMethod,
	NormalizedPidClaims,
	VerificationPolicy,
} from "@/domain/verification/verification-types";

type OrderStoreValue = {
	state: OrderState;
	addToCart: (product: WineProduct) => void;
	removeFromCart: (productId: string) => void;
	updateQuantity: (productId: string, quantity: number) => void;
	setShippingDestination: (destination: ShippingDestination | null) => void;
	setAgeVerificationMethod: (method: AgeVerificationMethod) => void;
	transitionTo: (nextStatus: OrderLifecycleStatus) => OrderTransitionResult;
	proceedToCheckout: () => OrderTransitionResult;
	confirmPayment: () => OrderTransitionResult;
	completeOrder: (input: {
		policy: VerificationPolicy | null;
		disclosedClaims: NormalizedPidClaims | null;
	}) => OrderTransitionResult;
	resetOrder: () => void;
	cartTotal: number;
	cartItemCount: number;
};

const OrderStoreContext = createContext<OrderStoreValue | null>(null);

function createOrderId(): string {
	return `order_${crypto.randomUUID()}`;
}

function calculateCartTotal(items: CartItem[]): number {
	return items.reduce(
		(total, item) => total + item.product.price * item.quantity,
		0,
	);
}

export function OrderStoreProvider({ children }: PropsWithChildren) {
	const [state, setState] = useState<OrderState>(createInitialOrderState());
	const stateRef = useRef(state);

	useEffect(() => {
		stateRef.current = state;
	}, [state]);

	const value = useMemo<OrderStoreValue>(() => {
		const applyState = (renderer: (current: OrderState) => OrderState) => {
			const nextState = renderer(stateRef.current);
			stateRef.current = nextState;
			setState(nextState);
		};

		return {
			state,
			addToCart: (product) => {
				applyState((current) => {
					const existing = current.items.find(
						(item) => item.product.id === product.id,
					);
					const items = existing
						? current.items.map((item) =>
								item.product.id === product.id
									? { ...item, quantity: item.quantity + 1 }
									: item,
							)
						: [...current.items, { product, quantity: 1 }];
					return {
						...current,
						items,
						lastError: null,
						updatedAt: new Date().toISOString(),
					};
				});
			},
			removeFromCart: (productId) => {
				applyState((current) => ({
					...current,
					items: current.items.filter((item) => item.product.id !== productId),
					lastError: null,
					updatedAt: new Date().toISOString(),
				}));
			},
			updateQuantity: (productId, quantity) => {
				applyState((current) => {
					if (quantity <= 0) {
						return {
							...current,
							items: current.items.filter(
								(item) => item.product.id !== productId,
							),
							lastError: null,
							updatedAt: new Date().toISOString(),
						};
					}
					return {
						...current,
						items: current.items.map((item) =>
							item.product.id === productId ? { ...item, quantity } : item,
						),
						lastError: null,
						updatedAt: new Date().toISOString(),
					};
				});
			},
			setShippingDestination: (destination) => {
				applyState((current) => ({
					...current,
					shippingDestination: destination,
					lastError: null,
					updatedAt: new Date().toISOString(),
				}));
			},
			setAgeVerificationMethod: (method) => {
				applyState(
					(current) => setOrderAgeVerificationMethod(current, method).state,
				);
			},
			transitionTo: (nextStatus) => {
				const result = transitionOrderState(stateRef.current, nextStatus);
				stateRef.current = result.state;
				setState(result.state);
				return result;
			},
			proceedToCheckout: () => {
				const current = stateRef.current;
				if (current.items.length === 0) {
					const errorState: OrderState = {
						...current,
						lastError: "Cart is empty",
						updatedAt: new Date().toISOString(),
					};
					stateRef.current = errorState;
					setState(errorState);
					return { ok: false, error: "Cart is empty", state: errorState };
				}
				if (!current.shippingDestination) {
					const errorState: OrderState = {
						...current,
						lastError: "No shipping destination selected",
						updatedAt: new Date().toISOString(),
					};
					stateRef.current = errorState;
					setState(errorState);
					return {
						ok: false,
						error: "No shipping destination selected",
						state: errorState,
					};
				}
				if (current.ageVerificationMethod === null) {
					const errorState: OrderState = {
						...current,
						lastError: "No age verification method selected",
						updatedAt: new Date().toISOString(),
					};
					stateRef.current = errorState;
					setState(errorState);
					return {
						ok: false,
						error: "No age verification method selected",
						state: errorState,
					};
				}

				const withId: OrderState = {
					...current,
					orderId: current.orderId ?? createOrderId(),
					lastError: null,
					updatedAt: new Date().toISOString(),
				};

				const reviewed =
					withId.status === "draft"
						? transitionOrderState(withId, "reviewed")
						: { ok: true as const, state: withId };
				if (!reviewed.ok) {
					stateRef.current = reviewed.state;
					setState(reviewed.state);
					return reviewed;
				}

				const result = transitionOrderState(
					reviewed.state,
					"awaiting_verification",
				);
				stateRef.current = result.state;
				setState(result.state);
				return result;
			},
			confirmPayment: () => {
				let current = stateRef.current;

				if (current.status === "awaiting_verification") {
					const verifiedResult = transitionOrderState(current, "verified");
					if (!verifiedResult.ok) {
						stateRef.current = verifiedResult.state;
						setState(verifiedResult.state);
						return verifiedResult;
					}
					current = verifiedResult.state;
				}

				if (current.status === "payment_confirmed") {
					return { ok: true as const, state: current };
				}

				const result = transitionOrderState(current, "payment_confirmed");
				stateRef.current = result.state;
				setState(result.state);
				return result;
			},
			completeOrder: (input) => {
				const current = stateRef.current;
				if (current.status !== "payment_confirmed") {
					const errorState: OrderState = {
						...current,
						lastError: "Order must be payment_confirmed before completion",
						updatedAt: new Date().toISOString(),
					};
					stateRef.current = errorState;
					setState(errorState);
					return {
						ok: false,
						error: "Order must be payment_confirmed before completion",
						state: errorState,
					};
				}

				if (!current.orderId || !current.shippingDestination) {
					const errorState: OrderState = {
						...current,
						lastError: "Missing order data for completion",
						updatedAt: new Date().toISOString(),
					};
					stateRef.current = errorState;
					setState(errorState);
					return {
						ok: false,
						error: "Missing order data for completion",
						state: errorState,
					};
				}

				const completionResult = transitionOrderState(current, "completed");
				if (!completionResult.ok) {
					stateRef.current = completionResult.state;
					setState(completionResult.state);
					return completionResult;
				}

				const confirmation: OrderConfirmation = {
					orderReference: current.orderId,
					completedAt: new Date().toISOString(),
					items: current.items,
					total: calculateCartTotal(current.items),
					shippingDestination: current.shippingDestination,
					policy: input.policy,
					disclosedClaims: input.disclosedClaims,
				};

				const finalState: OrderState = {
					...completionResult.state,
					confirmation,
					updatedAt: new Date().toISOString(),
				};
				stateRef.current = finalState;
				setState(finalState);
				return { ok: true, state: finalState };
			},
			resetOrder: () => {
				const resetState = createInitialOrderState();
				stateRef.current = resetState;
				setState(resetState);
			},
			cartTotal: calculateCartTotal(state.items),
			cartItemCount: state.items.reduce(
				(count, item) => count + item.quantity,
				0,
			),
		};
	}, [state]);

	return (
		<OrderStoreContext.Provider value={value}>
			{children}
		</OrderStoreContext.Provider>
	);
}

export function useOrderStore(): OrderStoreValue {
	const store = useContext(OrderStoreContext);
	if (!store) {
		throw new Error("useOrderStore must be used inside OrderStoreProvider");
	}
	return store;
}
