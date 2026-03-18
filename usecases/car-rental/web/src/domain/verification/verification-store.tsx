import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { BookingState } from "@/domain/booking/booking-types";
import {
	type AuthorizerCredential,
	createAuthorizerAuthorization,
	getAuthorizerAuthorizationStatus,
	getAuthorizerBaseUrl,
	getAuthorizerClientConfigError,
	getAuthorizerCredentials,
	getAuthorizerPolicyResponse,
} from "@/domain/verification/authorizer-client";
import {
	MDL_CREDENTIAL_ID,
	PID_CREDENTIAL_ID,
} from "@/domain/verification/verification-constants";
import {
	canTransitionVerificationLifecycle,
	isRecoverableVerificationFailure,
} from "@/domain/verification/verification-machine";
import {
	mapAuthorizerStatusToVerificationLifecycle,
	normalizeDisclosedClaims,
	normalizePolicyResult,
} from "@/domain/verification/verification-mappers";
import { buildVerificationRequestFromBooking } from "@/domain/verification/verification-request";
import type {
	VerificationLifecycleState,
	VerificationState,
} from "@/domain/verification/verification-schemas";

type VerificationActionResult =
	| {
			ok: true;
	  }
	| {
			ok: false;
			error: string;
	  };

type VerificationStoreValue = {
	state: VerificationState;
	wasHydrationReset: boolean;
	canRecoverFromFailure: boolean;
	canProceedToPayment: boolean;
	startVerification: (
		booking: BookingState,
	) => Promise<VerificationActionResult>;
	refreshLiveStatus: () => Promise<VerificationActionResult>;
	retryVerification: (
		booking: BookingState,
	) => Promise<VerificationActionResult>;
	resetVerification: () => void;
};

const VerificationStoreContext = createContext<VerificationStoreValue | null>(
	null,
);

function getApiKey(): string | undefined {
	const raw = import.meta.env.VITE_VIDOS_API_KEY;
	if (typeof raw !== "string") {
		return undefined;
	}

	const value = raw.trim();
	return value.length > 0 ? value : undefined;
}

function createInitialVerificationState(): VerificationState {
	return {
		lifecycle: "created",
		bookingId: null,
		authorizerId: null,
		authorizationUrl: null,
		request: null,
		correlation: null,
		policy: null,
		disclosedClaims: null,
		lastError: null,
		updatedAt: new Date().toISOString(),
	};
}

function transitionState(
	state: VerificationState,
	nextLifecycle: VerificationLifecycleState,
): VerificationActionResult {
	if (
		!canTransitionVerificationLifecycle(state.lifecycle, nextLifecycle) &&
		state.lifecycle !== nextLifecycle
	) {
		return {
			ok: false,
			error: `Transition not allowed: ${state.lifecycle} -> ${nextLifecycle}`,
		};
	}

	return { ok: true };
}

function mapCredentialToId(credential: AuthorizerCredential): string {
	if (credential.format === "mso_mdoc") {
		return MDL_CREDENTIAL_ID;
	}

	if (credential.credentialType.toLowerCase().includes("pid")) {
		return PID_CREDENTIAL_ID;
	}

	return MDL_CREDENTIAL_ID;
}

function mapCredentialsToDisclosedData(credentials: AuthorizerCredential[]): {
	credentials: Array<{ id: string; claims: Record<string, unknown> }>;
} {
	return {
		credentials: credentials.map((credential) => ({
			id: mapCredentialToId(credential),
			claims: credential.claims,
		})),
	};
}

function mapLifecycleError(
	lifecycle: VerificationLifecycleState,
): string | null {
	if (lifecycle === "error") {
		return "Verification returned an error state";
	}

	if (lifecycle === "rejected") {
		return "Verification was rejected";
	}

	if (lifecycle === "expired") {
		return "Verification expired";
	}

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

		const runStartVerification = async (
			booking: BookingState,
		): Promise<VerificationActionResult> => {
			const previousNonce = stateRef.current.request?.nonce ?? null;
			const requestResult = buildVerificationRequestFromBooking(booking, {
				previousNonce,
			});
			if (!requestResult.ok) {
				applyState((current) => ({
					...current,
					lifecycle: "error",
					lastError: requestResult.error,
					updatedAt: new Date().toISOString(),
				}));
				return { ok: false, error: requestResult.error };
			}

			const baseUrl = getAuthorizerBaseUrl();
			if (!baseUrl) {
				const error = getAuthorizerClientConfigError();
				applyState((current) => ({
					...current,
					lifecycle: "error",
					bookingId: requestResult.request.bookingId,
					request: requestResult.request,
					lastError: error,
					updatedAt: new Date().toISOString(),
				}));
				return { ok: false, error };
			}

			try {
				const session = await createAuthorizerAuthorization({
					baseUrl,
					apiKey: getApiKey(),
					nonce: requestResult.request.nonce,
				});

				const now = new Date().toISOString();
				applyState((current) => ({
					...current,
					lifecycle: "pending_wallet",
					bookingId: requestResult.request.bookingId,
					authorizerId: session.authorizationId,
					authorizationUrl: session.authorizeUrl,
					request: {
						...requestResult.request,
						nonce: session.nonce,
					},
					correlation: {
						bookingId: requestResult.request.bookingId,
						authorizerId: session.authorizationId,
						createdAt: now,
						updatedAt: now,
					},
					policy: null,
					disclosedClaims: null,
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
					bookingId: requestResult.request.bookingId,
					authorizationUrl: null,
					request: requestResult.request,
					lastError: message,
					updatedAt: new Date().toISOString(),
				}));
				return { ok: false, error: message };
			}
		};

		const refreshLiveStatus = async (): Promise<VerificationActionResult> => {
			const current = stateRef.current;
			if (!current.authorizerId || !current.bookingId) {
				return {
					ok: false,
					error: "Missing authorization session",
				};
			}

			const baseUrl = getAuthorizerBaseUrl();
			if (!baseUrl) {
				const error = getAuthorizerClientConfigError();
				applyState((next) => ({
					...next,
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
				const transitionResult = transitionState(current, lifecycle);
				if (!transitionResult.ok) {
					return transitionResult;
				}

				if (status !== "authorized") {
					applyState((next) => ({
						...next,
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

				applyState((next) => ({
					...next,
					lifecycle: "success",
					policy: normalizePolicyResult(policyResponse),
					disclosedClaims: normalizeDisclosedClaims(
						mapCredentialsToDisclosedData(credentials),
					),
					lastError: null,
					updatedAt: new Date().toISOString(),
				}));

				return { ok: true };
			} catch (error) {
				const message =
					error instanceof Error && error.message.length > 0
						? error.message
						: "Failed to fetch authorization status";
				applyState((next) => ({
					...next,
					lifecycle: "error",
					lastError: message,
					updatedAt: new Date().toISOString(),
				}));
				return { ok: false, error: message };
			}
		};

		return {
			state,
			wasHydrationReset: false,
			canRecoverFromFailure: isRecoverableVerificationFailure(state.lifecycle),
			canProceedToPayment: state.lifecycle === "success",
			startVerification: runStartVerification,
			refreshLiveStatus,
			retryVerification: async (booking) => {
				if (!isRecoverableVerificationFailure(stateRef.current.lifecycle)) {
					return {
						ok: false,
						error:
							"Retry is only available after rejected, expired, or error outcomes",
					};
				}

				return runStartVerification(booking);
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
