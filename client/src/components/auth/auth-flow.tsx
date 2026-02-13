import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Clock, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { DcApiRequest, PresentationMode } from "shared/types/auth";
import type { AuthorizationErrorInfo } from "shared/types/vidos-errors";
import { CredentialDisclosure } from "@/components/auth/credential-disclosure";
import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { ModeSelector } from "@/components/auth/mode-selector";
import { PollingStatus } from "@/components/auth/polling-status";
import { QRCodeDisplay } from "@/components/auth/qr-code-display";
import { VidosErrorDisplay } from "@/components/auth/vidos-error-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStoredMode, setStoredMode } from "@/lib/auth-helpers";

// ============================================================================
// Types
// ============================================================================

export type AuthState =
	| { status: "idle" }
	| {
			status: "awaiting_verification";
			mode: "direct_post";
			requestId: string;
			authorizeUrl: string;
			requestedClaims: string[];
			purpose: string;
	  }
	| {
			status: "awaiting_verification";
			mode: "dc_api";
			requestId: string;
			dcApiRequest: DcApiRequest;
			requestedClaims: string[];
			purpose: string;
	  }
	| { status: "success"; sessionId: string }
	| {
			status: "error";
			message: string;
			errorType?: string;
			errorInfo?: AuthorizationErrorInfo;
	  }
	| { status: "expired" };

type DirectPostRequestResult = {
	mode: "direct_post";
	requestId: string;
	authorizeUrl: string;
	requestedClaims: string[];
	purpose: string;
};

type DcApiRequestResult = {
	mode: "dc_api";
	requestId: string;
	dcApiRequest: DcApiRequest;
	requestedClaims: string[];
	purpose: string;
};

type RequestResult = DirectPostRequestResult | DcApiRequestResult;

type PollingResult = {
	status: string;
	sessionId?: string;
	mode?: PresentationMode;
	error?: string;
	errorInfo?: AuthorizationErrorInfo;
} & Record<string, unknown>;

type CompleteResult = {
	sessionId: string;
	mode: PresentationMode;
};

export type AuthFlowConfig = {
	/** Unique key for query cache (e.g., "signin", "signup") */
	flowKey: string;

	/** API functions */
	api: {
		createRequest: (
			params: { mode: "direct_post" } | { mode: "dc_api"; origin: string },
		) => Promise<RequestResult>;
		pollStatus: (requestId: string) => Promise<PollingResult>;
		completeRequest: (
			requestId: string,
			response: Record<string, unknown>,
			origin: string,
		) => Promise<CompleteResult>;
	};

	/** Handle successful authorization */
	onSuccess: (sessionId: string, mode: PresentationMode) => void;

	/** Map polling/API errors to state */
	mapPollingResult?: (
		result: PollingResult,
	) => { handled: true; state: AuthState } | { handled: false };

	/** Map request errors to state */
	mapRequestError?: (
		error: unknown,
	) => { handled: true; state: AuthState } | { handled: false };

	/** Map complete errors to state */
	mapCompleteError?: (
		error: unknown,
	) => { handled: true; state: AuthState } | { handled: false };

	/** Custom slots */
	slots: {
		/** Left panel content (traditional method) */
		leftPanel: ReactNode;
		/** Right panel feature list items */
		walletFeatures: ReactNode;
		/** Footer content below button */
		footer: ReactNode;
		/** Success state content */
		successContent?: (sessionId: string) => ReactNode;
		/** Custom error content by errorType */
		errorContent?: (
			message: string,
			errorType: string | undefined,
			onRetry: () => void,
		) => ReactNode | null;
	};

	/** Labels */
	labels: {
		rightPanelTitle: string;
		rightPanelDescription: string;
		buttonText: string;
		buttonLoadingText: string;
	};
};

// ============================================================================
// Component
// ============================================================================

export function AuthFlow({ config }: { config: AuthFlowConfig }) {
	const [mode, setMode] = useState<PresentationMode>(getStoredMode);
	const [state, setState] = useState<AuthState>({ status: "idle" });
	const [pollingStartTime, setPollingStartTime] = useState<number | null>(null);

	const handleModeChange = (newMode: PresentationMode) => {
		setMode(newMode);
		setStoredMode(newMode);
	};

	// Request mutation
	const requestMutation = useMutation({
		mutationFn: () =>
			config.api.createRequest(
				mode === "direct_post"
					? { mode: "direct_post" }
					: { mode: "dc_api", origin: window.location.origin },
			),
		onSuccess: (data) => {
			console.log(`[${config.flowKey}] request created:`, data.requestId);
			setPollingStartTime(Date.now());
			if (data.mode === "direct_post") {
				setState({
					status: "awaiting_verification",
					mode: "direct_post",
					requestId: data.requestId,
					authorizeUrl: data.authorizeUrl,
					requestedClaims: data.requestedClaims,
					purpose: data.purpose,
				});
			} else {
				setState({
					status: "awaiting_verification",
					mode: "dc_api",
					requestId: data.requestId,
					dcApiRequest: data.dcApiRequest,
					requestedClaims: data.requestedClaims,
					purpose: data.purpose,
				});
			}
		},
		onError: (err) => {
			console.error(`[${config.flowKey}] error:`, err);
			const mapped = config.mapRequestError?.(err);
			if (mapped?.handled) {
				setState(mapped.state);
			} else {
				setState({
					status: "error",
					message: err instanceof Error ? err.message : "Unknown error",
				});
			}
		},
	});

	// Polling for direct_post mode
	const currentRequestId =
		state.status === "awaiting_verification" && state.mode === "direct_post"
			? state.requestId
			: null;

	const pollingQuery = useQuery({
		queryKey: [config.flowKey, "status", currentRequestId],
		queryFn: () => {
			if (!currentRequestId) throw new Error("No request ID");
			return config.api.pollStatus(currentRequestId);
		},
		enabled: !!currentRequestId,
		refetchInterval: (query) => {
			if (!pollingStartTime) return false;
			if (Date.now() - pollingStartTime > 5 * 60 * 1000) return false;
			const count = query.state.dataUpdateCount;
			return Math.min(1000 * 1.5 ** count, 5000);
		},
	});

	// Handle polling results
	if (pollingQuery.data && state.status === "awaiting_verification") {
		const data = pollingQuery.data;

		// Try custom mapping first
		const mapped = config.mapPollingResult?.(data);
		if (mapped?.handled) {
			setState(mapped.state);
		} else if (data.status === "authorized" && data.sessionId) {
			console.log(`[${config.flowKey}] authorized!`);
			setStoredMode(data.mode || mode);
			config.onSuccess(data.sessionId, data.mode || mode);
			setState({ status: "success", sessionId: data.sessionId });
		} else if (data.status === "expired") {
			setState({ status: "expired" });
		} else if (data.status === "rejected" || data.status === "error") {
			setState({
				status: "error",
				message: data.error || `Verification ${data.status}`,
				errorInfo: data.errorInfo,
			});
		}
	}

	// Timeout check
	if (
		state.status === "awaiting_verification" &&
		state.mode === "direct_post" &&
		pollingStartTime &&
		Date.now() - pollingStartTime > 5 * 60 * 1000
	) {
		setState({ status: "error", message: "Verification timed out" });
	}

	// DC API completion mutation
	const completeMutation = useMutation({
		mutationFn: ({
			requestId,
			response,
		}: {
			requestId: string;
			response: Record<string, unknown>;
		}) =>
			config.api.completeRequest(requestId, response, window.location.origin),
		onSuccess: (data) => {
			console.log(`[${config.flowKey}] DC API complete success!`);
			setStoredMode(data.mode);
			config.onSuccess(data.sessionId, data.mode);
			setState({ status: "success", sessionId: data.sessionId });
		},
		onError: (err) => {
			console.error(`[${config.flowKey}] complete error:`, err);
			const mapped = config.mapCompleteError?.(err);
			if (mapped?.handled) {
				setState(mapped.state);
			} else {
				setState({
					status: "error",
					message: err instanceof Error ? err.message : "Completion failed",
				});
			}
		},
	});

	const handleDCApiSuccess = (response: {
		protocol: string;
		data: Record<string, unknown>;
	}) => {
		if (state.status !== "awaiting_verification") return;
		completeMutation.mutate({
			requestId: state.requestId,
			response: response.data,
		});
	};

	const handleCancel = () => {
		setState({ status: "idle" });
	};

	const elapsedSeconds = pollingStartTime
		? Math.floor((Date.now() - pollingStartTime) / 1000)
		: 0;

	// ============================================================================
	// Render
	// ============================================================================

	return (
		<div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
			<div className="w-full max-w-6xl">
				{state.status === "idle" && (
					<div className="relative grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
						{/* Traditional Method - Left Panel */}
						<div className="relative bg-gradient-to-br from-muted/30 via-muted/10 to-background p-8 lg:p-12 animate-slide-in-left">
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-muted-foreground/20 to-transparent" />
							<div className="relative z-10 h-full flex flex-col">
								{config.slots.leftPanel}
							</div>
						</div>

						{/* Divider */}
						<div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center">
							<div className="absolute w-24 h-24 bg-background blur-xl" />
							<div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg border-4 border-background">
								<span className="text-sm font-bold text-primary-foreground">
									OR
								</span>
							</div>
						</div>

						{/* Mobile Divider */}
						<div className="lg:hidden relative py-6">
							<div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
							<div className="relative flex justify-center">
								<div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg">
									<span className="text-xs font-bold text-primary-foreground">
										OR
									</span>
								</div>
							</div>
						</div>

						{/* Wallet Method - Right Panel */}
						<div className="relative bg-gradient-to-br from-primary/5 via-accent/10 to-background p-8 lg:p-12 animate-slide-in-right">
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary/30 to-transparent" />
							<div className="relative z-10 h-full flex flex-col">
								<div className="mb-8">
									<div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
										<span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
											Recommended
										</span>
									</div>
									<h2 className="text-2xl lg:text-3xl font-bold mb-3 text-foreground">
										{config.labels.rightPanelTitle}
									</h2>
									<p className="text-sm text-muted-foreground max-w-md">
										{config.labels.rightPanelDescription}
									</p>
								</div>

								<div className="flex-1 flex flex-col justify-center space-y-6">
									<div className="space-y-4">{config.slots.walletFeatures}</div>

									<div className="pt-6 space-y-4">
										<ModeSelector value={mode} onChange={handleModeChange} />
										<Button
											onClick={() => requestMutation.mutate()}
											disabled={requestMutation.isPending}
											className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
											size="lg"
										>
											{requestMutation.isPending ? (
												<>
													<Loader2 className="mr-2 h-5 w-5 animate-spin" />
													{config.labels.buttonLoadingText}
												</>
											) : (
												config.labels.buttonText
											)}
										</Button>
									</div>
								</div>

								<div className="mt-6 text-center">{config.slots.footer}</div>
							</div>
						</div>
					</div>
				)}

				{state.status === "awaiting_verification" &&
					state.mode === "direct_post" && (
						<Card className="w-full max-w-2xl mx-auto animate-fade-in">
							<CardContent className="p-8">
								<CredentialDisclosure
									requestedClaims={state.requestedClaims}
									purpose={state.purpose}
								/>
								<QRCodeDisplay url={state.authorizeUrl} />
								<PollingStatus
									elapsedSeconds={elapsedSeconds}
									onCancel={handleCancel}
								/>
							</CardContent>
						</Card>
					)}

				{state.status === "awaiting_verification" &&
					state.mode === "dc_api" && (
						<Card className="w-full max-w-2xl mx-auto animate-fade-in">
							<CardContent className="p-8">
								<CredentialDisclosure
									requestedClaims={state.requestedClaims}
									purpose={state.purpose}
								/>
								<DCApiHandler
									dcApiRequest={state.dcApiRequest}
									onSuccess={handleDCApiSuccess}
									onError={(msg) => setState({ status: "error", message: msg })}
								/>
								{completeMutation.isPending && (
									<div className="flex items-center justify-center gap-3 py-4 mt-4">
										<Loader2 className="h-5 w-5 animate-spin text-primary" />
										<p className="text-muted-foreground">
											Completing verification...
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					)}

				{state.status === "success" &&
					config.slots.successContent?.(state.sessionId)}

				{state.status === "error" &&
					(config.slots.errorContent?.(
						state.message,
						state.errorType,
						handleCancel,
					) ??
						(state.errorInfo ? (
							<VidosErrorDisplay
								errorInfo={state.errorInfo}
								onRetry={handleCancel}
							/>
						) : (
							<Card className="w-full max-w-2xl mx-auto animate-slide-up">
								<CardContent className="p-12">
									<div className="space-y-6 text-center">
										<div className="flex justify-center">
											<div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
												<AlertCircle className="w-12 h-12 text-destructive" />
											</div>
										</div>
										<div className="space-y-2">
											<h3 className="text-2xl font-bold text-foreground">
												Something Went Wrong
											</h3>
											<p className="text-sm text-muted-foreground max-w-md mx-auto">
												{state.message}
											</p>
										</div>
										<Button
											onClick={handleCancel}
											variant="outline"
											className="w-full max-w-sm mx-auto"
										>
											Try Again
										</Button>
									</div>
								</CardContent>
							</Card>
						)))}

				{state.status === "expired" && (
					<Card className="w-full max-w-2xl mx-auto animate-slide-up">
						<CardContent className="p-12">
							<div className="space-y-6 text-center">
								<div className="flex justify-center">
									<div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
										<Clock className="w-12 h-12 text-amber-600" />
									</div>
								</div>
								<div className="space-y-2">
									<h3 className="text-2xl font-bold text-foreground">
										Request Expired
									</h3>
									<p className="text-sm text-muted-foreground max-w-md mx-auto">
										The verification request has expired. Please try again.
									</p>
								</div>
								<Button
									onClick={handleCancel}
									variant="outline"
									className="w-full max-w-sm mx-auto"
								>
									Try Again
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}

// ============================================================================
// Reusable Slot Components
// ============================================================================

export function WalletFeatureItem({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-primary/10">
			<div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
			<div>
				<p className="text-sm font-medium text-foreground mb-1">{title}</p>
				<p className="text-xs text-muted-foreground">{description}</p>
			</div>
		</div>
	);
}

export function AuthFooter() {
	return (
		<p className="text-xs text-muted-foreground">
			By continuing, you agree to DemoBank's{" "}
			<span className="text-primary hover:underline cursor-pointer">Terms</span>{" "}
			and{" "}
			<span className="text-primary hover:underline cursor-pointer">
				Privacy Policy
			</span>
		</p>
	);
}

export function GenericAuthError({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	return (
		<Card className="w-full max-w-2xl mx-auto animate-slide-up">
			<CardContent className="p-12">
				<div className="space-y-6 text-center">
					<div className="flex justify-center">
						<div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
							<AlertCircle className="w-12 h-12 text-destructive" />
						</div>
					</div>
					<div className="space-y-2">
						<h3 className="text-2xl font-bold text-foreground">
							Something Went Wrong
						</h3>
						<p className="text-sm text-muted-foreground max-w-md mx-auto">
							{message}
						</p>
					</div>
					<Button
						onClick={onRetry}
						variant="outline"
						className="w-full max-w-sm mx-auto"
					>
						Try Again
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
