import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Fingerprint,
	Loader2,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { CredentialFormats, DcApiRequest } from "demo-bank-shared/types/auth";
import type { AuthorizationErrorInfo } from "demo-bank-shared/types/vidos-errors";
import { z } from "zod";
import { CredentialDisclosure } from "@/components/auth/credential-disclosure";
import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { QRCodeDisplay } from "@/components/auth/qr-code-display";
import { VerificationStatus } from "@/components/auth/verification-status";
import { VidosErrorDisplay } from "@/components/auth/vidos-error-display";
import { Button } from "@/components/ui/button";
import { getStoredCredentialFormats, getStoredMode } from "@/lib/auth-helpers";
import { useAuthorizationStream } from "@/lib/use-authorization-stream";

import { cn } from "@/lib/utils";

const confirmSearchSchema = z.object({
	recipient: z.string(),
	amount: z.string(),
	reference: z.string().optional(),
});

export const Route = createFileRoute("/_app/_auth/send/confirm")({
	validateSearch: confirmSearchSchema,
	component: PaymentConfirmPage,
});

type PaymentState =
	| { status: "idle" }
	| {
			status: "awaiting_verification";
			mode: "direct_post";
			requestId: string;
			authorizeUrl: string;
			credentialFormats: CredentialFormats;
			requestedClaims: string[];
			purpose: string;
	  }
	| {
			status: "awaiting_verification";
			mode: "dc_api";
			requestId: string;
			dcApiRequest: DcApiRequest;
			credentialFormats: CredentialFormats;
			requestedClaims: string[];
			purpose: string;
	  }
	| { status: "success"; transactionId: string }
	| { status: "error"; message: string; errorInfo?: AuthorizationErrorInfo }
	| { status: "expired" };

function PaymentConfirmPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { apiClient } = useRouteContext({ from: "__root__" });
	const search = Route.useSearch();
	const [state, setState] = useState<PaymentState>({ status: "idle" });

	// Mutation for starting payment verification
	const requestMutation = useMutation({
		mutationFn: async () => {
			const mode = getStoredMode();
			const credentialFormats = getStoredCredentialFormats();
			const baseParams = {
				recipient: search.recipient,
				amount: search.amount,
				reference: search.reference,
				credentialFormats,
			};

			const res = await apiClient.api.payment.request.$post({
				json:
					mode === "dc_api"
						? {
								...baseParams,
								mode: "dc_api" as const,
								origin: window.location.origin,
							}
						: { ...baseParams, mode: "direct_post" as const },
			});

			if (!res.ok) throw new Error("Failed to create payment request");

			const data = await res.json();
			return { data, credentialFormats };
		},
		onSuccess: ({ data, credentialFormats }) => {
			if (data.mode === "direct_post") {
				setState({
					status: "awaiting_verification",
					mode: "direct_post",
					requestId: data.requestId,
					authorizeUrl: data.authorizeUrl,
					credentialFormats,
					requestedClaims: data.requestedClaims,
					purpose: data.purpose,
				});
			} else {
				setState({
					status: "awaiting_verification",
					mode: "dc_api",
					requestId: data.requestId,
					dcApiRequest: data.dcApiRequest,
					credentialFormats,
					requestedClaims: data.requestedClaims,
					purpose: data.purpose,
				});
			}
		},
		onError: (err) => {
			setState({
				status: "error",
				message: err instanceof Error ? err.message : "Unknown error",
			});
		},
	});

	const directPostRequestId =
		state.status === "awaiting_verification" && state.mode === "direct_post"
			? state.requestId
			: null;

	const isDirectPostVerificationActive =
		state.status === "awaiting_verification" && state.mode === "direct_post";

	useAuthorizationStream({
		requestId: directPostRequestId,
		streamPath: "/api/payment/stream",
		enabled: isDirectPostVerificationActive,
		withSession: true,
		onEvent: (event, controls) => {
			if (event.eventType === "connected" || event.eventType === "pending") {
				return;
			}

			if (event.eventType === "authorized") {
				if (!event.transactionId) {
					setState({
						status: "error",
						message: "Verification completed without transaction details",
					});
					controls.close();
					return;
				}

				setState({ status: "success", transactionId: event.transactionId });
				queryClient.invalidateQueries({ queryKey: ["user", "me"] });
				navigate({
					to: "/send/success",
					search: {
						transactionId: event.transactionId,
						recipient: search.recipient,
						amount: search.amount,
						reference: search.reference,
						confirmedAt: new Date().toISOString(),
					},
				});
				controls.close();
				return;
			}

			if (event.eventType === "expired") {
				setState({ status: "expired" });
				controls.close();
				return;
			}

			if (event.eventType === "rejected") {
				setState({
					status: "error",
					message: event.message,
					errorInfo: event.errorInfo,
				});
				controls.close();
				return;
			}

			setState({
				status: "error",
				message: event.message,
				errorInfo: "errorInfo" in event ? event.errorInfo : undefined,
			});
			controls.close();
		},
		onParseError: () => {
			setState({ status: "error", message: "Invalid stream payload" });
		},
	});

	// Mutation for DC API completion
	const completeMutation = useMutation({
		mutationFn: async ({
			requestId,
			response,
		}: {
			requestId: string;
			response: Record<string, unknown>;
		}) => {
			const res = await apiClient.api.payment.complete[":requestId"].$post({
				param: { requestId },
				json: { origin: window.location.origin, dcResponse: response },
			});

			if (!res.ok) {
				// Try to parse error response with errorInfo
				if (res.status === 400) {
					try {
						const errorBody = (await res.json()) as {
							error?: string;
							errorInfo?: AuthorizationErrorInfo;
						};
						if (errorBody.errorInfo) {
							throw {
								type: "vidos_error" as const,
								errorInfo: errorBody.errorInfo,
							};
						}
					} catch (e) {
						if (e && typeof e === "object" && "type" in e) throw e;
					}
				}
				throw new Error("Completion failed");
			}

			return res.json();
		},
		onSuccess: (data) => {
			setState({ status: "success", transactionId: data.transactionId });
			queryClient.invalidateQueries({ queryKey: ["user", "me"] });
			navigate({
				to: "/send/success",
				search: {
					transactionId: data.transactionId,
					recipient: data.recipient,
					amount: data.amount,
					reference: data.reference,
					confirmedAt: data.confirmedAt,
				},
			});
		},
		onError: (err) => {
			// Handle Vidos error
			if (err && typeof err === "object" && "type" in err) {
				const typedErr = err as {
					type: string;
					errorInfo?: AuthorizationErrorInfo;
				};
				if (typedErr.type === "vidos_error" && typedErr.errorInfo) {
					setState({
						status: "error",
						message: "Verification failed",
						errorInfo: typedErr.errorInfo,
					});
					return;
				}
			}
			setState({
				status: "error",
				message: err instanceof Error ? err.message : "Completion failed",
			});
		},
	});

	const handleDCApiSuccess = (response: {
		protocol: string;
		data: Record<string, unknown>;
	}) => {
		if (state.status !== "awaiting_verification") return;
		// Pass data (the actual credential response) not the wrapper object
		completeMutation.mutate({
			requestId: state.requestId,
			response: response.data,
		});
	};

	const handleDCApiError = (error: string) => {
		setState({ status: "error", message: error });
	};

	const handleCancel = () => {
		setState({ status: "idle" });
	};

	return (
		<div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<Button asChild variant="ghost" size="sm" className="gap-2 shrink-0">
						<Link to="/send">
							<ArrowLeft className="h-4 w-4" />
							<span>Back</span>
						</Link>
					</Button>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<ShieldCheck className="h-4 w-4 text-primary" />
						<span className="font-mono uppercase tracking-wider">
							Secure Payment
						</span>
					</div>
				</div>

				{/* Idle & verification states use 2-col layout */}
				{(state.status === "idle" ||
					state.status === "awaiting_verification") && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
						{/* Transaction summary card */}
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 lg:p-8 space-y-4">
								<h2 className="text-lg lg:text-xl font-semibold">
									Payment Summary
								</h2>

								{/* Amount - large display */}
								<div className="py-6 lg:py-8 text-center">
									<p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
										Amount
									</p>
									<p className="text-4xl lg:text-5xl font-bold font-mono tracking-tight">
										€{search.amount}
									</p>
								</div>

								{/* Details */}
								<div className="space-y-3 pt-4 border-t border-border/40">
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Recipient
										</span>
										<span className="font-medium">{search.recipient}</span>
									</div>
									{search.reference && (
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">
												Reference
											</span>
											<span className="font-medium">{search.reference}</span>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Action card */}
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 lg:p-8 space-y-4">
								{/* Idle State */}
								{state.status === "idle" && (
									<>
										<div>
											<h3 className="text-lg font-semibold mb-2">
												Verify Payment
											</h3>
											<p className="text-sm text-muted-foreground">
												Your identity will be verified using your PID
												credential. No passwords are transmitted.
											</p>
										</div>
										<Button
											onClick={() => requestMutation.mutate()}
											disabled={requestMutation.isPending}
											className="w-full h-12 text-base group"
										>
											{requestMutation.isPending ? (
												<>
													<Loader2 className="mr-2 h-5 w-5 animate-spin" />
													Creating request...
												</>
											) : (
												<>
													<Fingerprint className="mr-2 h-5 w-5" />
													Verify with Wallet
												</>
											)}
										</Button>
									</>
								)}

								{/* Awaiting Verification - Direct Post Mode */}
								{state.status === "awaiting_verification" &&
									state.mode === "direct_post" && (
										<div className="space-y-4">
											<CredentialDisclosure
												credentialFormats={state.credentialFormats}
												requestedClaims={state.requestedClaims}
												purpose={state.purpose}
											/>
											<QRCodeDisplay url={state.authorizeUrl} />
											<VerificationStatus onCancel={handleCancel} />
										</div>
									)}

								{/* Awaiting Verification - DC API Mode */}
								{state.status === "awaiting_verification" &&
									state.mode === "dc_api" && (
										<div className="space-y-4">
											<CredentialDisclosure
												credentialFormats={state.credentialFormats}
												requestedClaims={state.requestedClaims}
												purpose={state.purpose}
											/>
											<DCApiHandler
												dcApiRequest={state.dcApiRequest}
												onSuccess={handleDCApiSuccess}
												onError={handleDCApiError}
											/>
											{completeMutation.isPending && (
												<div className="flex items-center justify-center gap-3 py-4">
													<Loader2 className="h-5 w-5 animate-spin text-primary" />
													<p className="text-muted-foreground">
														Processing payment...
													</p>
												</div>
											)}
										</div>
									)}
							</div>
						</div>
					</div>
				)}

				{/* Error State */}
				{state.status === "error" && (
					<div className="max-w-2xl mx-auto">
						{state.errorInfo ? (
							<VidosErrorDisplay
								errorInfo={state.errorInfo}
								onRetry={() => navigate({ to: "/send" })}
							/>
						) : (
							<div className="space-y-4">
								<div
									className={cn(
										"flex items-start gap-3 p-4 lg:p-6 rounded-xl",
										"bg-destructive/10 border border-destructive/20 text-destructive",
									)}
								>
									<AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
									<div className="space-y-1">
										<p className="font-medium">Payment Failed</p>
										<p className="text-sm opacity-80">{state.message}</p>
									</div>
								</div>
								<div className="flex gap-3">
									<Button
										onClick={() => navigate({ to: "/send" })}
										variant="outline"
										className="flex-1 h-12"
									>
										Start Over
									</Button>
									<Button
										onClick={() => requestMutation.mutate()}
										disabled={requestMutation.isPending}
										className="flex-1 h-12"
									>
										{requestMutation.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											"Retry"
										)}
									</Button>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Expired State */}
				{state.status === "expired" && (
					<div className="max-w-2xl mx-auto space-y-4">
						<div
							className={cn(
								"flex items-start gap-3 p-4 lg:p-6 rounded-xl",
								"bg-amber-500/10 border border-amber-500/20 text-amber-700",
							)}
						>
							<Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="font-medium">Request Expired</p>
								<p className="text-sm opacity-80">
									The verification request has expired. Please try again.
								</p>
							</div>
						</div>
						<div className="flex gap-3">
							<Button
								onClick={() => navigate({ to: "/send" })}
								variant="outline"
								className="flex-1 h-12"
							>
								Start Over
							</Button>
							<Button
								onClick={() => requestMutation.mutate()}
								disabled={requestMutation.isPending}
								className="flex-1 h-12"
							>
								{requestMutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									"Retry"
								)}
							</Button>
						</div>
					</div>
				)}

				{/* Success State */}
				{state.status === "success" && (
					<div className="max-w-2xl mx-auto rounded-2xl border border-border/60 bg-background p-8">
						<div className="flex items-center justify-center gap-3 py-4 text-green-600">
							<CheckCircle2 className="h-6 w-6" />
							<p className="font-medium">Payment Verified</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
