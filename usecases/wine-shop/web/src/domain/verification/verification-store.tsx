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
import { checkAgeEligibility } from "@/domain/verification/age-check";
import {
	createAuthorizerAuthorization,
	getAuthorizerAuthorizationStatus,
	getAuthorizerBaseUrl,
	getAuthorizerClientConfigError,
	getAuthorizerCredentials,
	getAuthorizerPolicyResponse,
} from "@/domain/verification/authorizer-client";
import {
	canTransitionVerificationLifecycle,
	isRecoverableVerificationFailure,
} from "@/domain/verification/verification-machine";
import {
	mapAuthorizerStatusToVerificationLifecycle,
	normalizeDisclosedClaims,
	normalizePolicyResult,
} from "@/domain/verification/verification-mappers";
import { createVerificationNonce } from "@/domain/verification/verification-request";
import type {
	AgeVerificationMethod,
	VerificationLifecycleState,
	VerificationState,
} from "@/domain/verification/verification-types";

type VerificationActionResult = { ok: true } | { ok: false; error: string };

type VerificationStoreValue = {
	state: VerificationState;
	canRecoverFromFailure: boolean;
	canProceedToPayment: boolean;
	startVerification: (input: {
		orderId: string;
		shippingDestination: ShippingDestination;
		ageVerificationMethod: AgeVerificationMethod;
	}) => Promise<VerificationActionResult>;
	refreshLiveStatus: (
		shippingDestination: ShippingDestination,
	) => Promise<VerificationActionResult>;
	retryVerification: (input: {
		orderId: string;
		shippingDestination: ShippingDestination;
		ageVerificationMethod: AgeVerificationMethod;
	}) => Promise<VerificationActionResult>;
	resetVerification: () => void;
};

const VerificationStoreContext = createContext<VerificationStoreValue | null>(
	null,
);

function getApiKey(): string | undefined {
	const raw = import.meta.env.VITE_VIDOS_API_KEY;
	if (typeof raw !== "string") return undefined;
	const value = raw.trim();
	return value.length > 0 ? value : undefined;
}

function createInitialVerificationState(): VerificationState {
	return {
		lifecycle: "created",
		orderId: null,
		authorizerId: null,
		authorizationUrl: null,
		nonce: null,
		policy: null,
		disclosedClaims: null,
		ageCheck: null,
		lastError: null,
		updatedAt: new Date().toISOString(),
	};
}

function mapLifecycleError(
	lifecycle: VerificationLifecycleState,
): string | null {
	if (lifecycle === "error") return "Verification returned an error state";
	if (lifecycle === "rejected") return "Verification was rejected";
	if (lifecycle === "expired") return "Verification expired";
	return null;
}

export function VerificationStoreProvider({ children }: PropsWithChildren) {
	const [state, setState] = useState<VerificationState>(
		createInitialVerificationState(),
	);
	const stateRef = useRef(state);

	useEffect(() => {
		stateRef.current = state;
	}, [state]);

	const value = useMemo<VerificationStoreValue>(() => {
		const applyState = (
			renderer: (current: VerificationState) => VerificationState,
		): VerificationState => {
			const nextState = renderer(stateRef.current);
			stateRef.current = nextState;
			setState(nextState);
			return nextState;
		};

		const runStartVerification = async (input: {
			orderId: string;
			shippingDestination: ShippingDestination;
			ageVerificationMethod: AgeVerificationMethod;
		}): Promise<VerificationActionResult> => {
			const nonce = createVerificationNonce();
			const baseUrl = getAuthorizerBaseUrl();
			if (!baseUrl) {
				const error = getAuthorizerClientConfigError();
				applyState((current) => ({
					...current,
					lifecycle: "error",
					orderId: input.orderId,
					nonce,
					lastError: error,
					updatedAt: new Date().toISOString(),
				}));
				return { ok: false, error };
			}

			try {
				const session = await createAuthorizerAuthorization({
					baseUrl,
					apiKey: getApiKey(),
					nonce,
					requiredAge: input.shippingDestination.legalDrinkingAge,
					ageVerificationMethod: input.ageVerificationMethod,
				});

				const now = new Date().toISOString();
				applyState((current) => ({
					...current,
					lifecycle: "pending_wallet",
					orderId: input.orderId,
					authorizerId: session.authorizationId,
					authorizationUrl: session.authorizeUrl,
					nonce: session.nonce,
					policy: null,
					disclosedClaims: null,
					ageCheck: null,
					lastError: null,
					updatedAt: now,
				}));

				return { ok: true };
			} catch (error) {
				const message =
					error instanceof Error && error.message.length > 0
						? error.message
						: "Failed to create authorization session";
				applyState((current) => ({
					...current,
					lifecycle: "error",
					orderId: input.orderId,
					authorizationUrl: null,
					nonce,
					lastError: message,
					updatedAt: new Date().toISOString(),
				}));
				return { ok: false, error: message };
			}
		};

		const refreshLiveStatus = async (
			shippingDestination: ShippingDestination,
		): Promise<VerificationActionResult> => {
			const current = stateRef.current;
			if (!current.authorizerId || !current.orderId) {
				return { ok: false, error: "Missing authorization session" };
			}

			const baseUrl = getAuthorizerBaseUrl();
			if (!baseUrl) {
				const error = getAuthorizerClientConfigError();
				applyState((s) => ({
					...s,
					lifecycle: "error",
					lastError: error,
					updatedAt: new Date().toISOString(),
				}));
				return { ok: false, error };
			}

			try {
				const status = await getAuthorizerAuthorizationStatus({
					baseUrl,
					apiKey: getApiKey(),
					authorizationId: current.authorizerId,
				});

				const lifecycle = mapAuthorizerStatusToVerificationLifecycle(status);

				if (
					!canTransitionVerificationLifecycle(current.lifecycle, lifecycle) &&
					current.lifecycle !== lifecycle
				) {
					return {
						ok: false,
						error: `Transition not allowed: ${current.lifecycle} -> ${lifecycle}`,
					};
				}

				if (status !== "authorized") {
					applyState((s) => ({
						...s,
						lifecycle,
						lastError: mapLifecycleError(lifecycle),
						updatedAt: new Date().toISOString(),
					}));
					return { ok: true };
				}

				const [policyResponse, credentials] = await Promise.all([
					getAuthorizerPolicyResponse({
						baseUrl,
						apiKey: getApiKey(),
						authorizationId: current.authorizerId,
					}),
					getAuthorizerCredentials({
						baseUrl,
						apiKey: getApiKey(),
						authorizationId: current.authorizerId,
					}),
				]);

				const policy = normalizePolicyResult(policyResponse);
				const claims = normalizeDisclosedClaims(credentials);
				const ageCheck = checkAgeEligibility(
					claims,
					shippingDestination.legalDrinkingAge,
					shippingDestination.label,
				);

				applyState((s) => ({
					...s,
					lifecycle: "success",
					policy,
					disclosedClaims: claims,
					ageCheck,
					lastError: null,
					updatedAt: new Date().toISOString(),
				}));

				return { ok: true };
			} catch (error) {
				const message =
					error instanceof Error && error.message.length > 0
						? error.message
						: "Failed to fetch authorization status";
				applyState((s) => ({
					...s,
					lifecycle: "error",
					lastError: message,
					updatedAt: new Date().toISOString(),
				}));
				return { ok: false, error: message };
			}
		};

		return {
			state,
			canRecoverFromFailure: isRecoverableVerificationFailure(state.lifecycle),
			canProceedToPayment:
				state.lifecycle === "success" &&
				state.ageCheck !== null &&
				state.ageCheck.eligible,
			startVerification: runStartVerification,
			refreshLiveStatus,
			retryVerification: async (input) => {
				if (!isRecoverableVerificationFailure(stateRef.current.lifecycle)) {
					return {
						ok: false,
						error: "Retry only available after rejected, expired, or error",
					};
				}
				return runStartVerification(input);
			},
			resetVerification: () => {
				const resetState = createInitialVerificationState();
				stateRef.current = resetState;
				setState(resetState);
			},
		};
	}, [state]);

	return (
		<VerificationStoreContext.Provider value={value}>
			{children}
		</VerificationStoreContext.Provider>
	);
}

export function useVerificationStore(): VerificationStoreValue {
	const store = useContext(VerificationStoreContext);
	if (!store) {
		throw new Error(
			"useVerificationStore must be used inside VerificationStoreProvider",
		);
	}
	return store;
}
