import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import {
	AlertCircle,
	Briefcase,
	Calculator,
	Car,
	Clock,
	Euro,
	Fingerprint,
	GraduationCap,
	Home,
	Loader2,
	Percent,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LOAN_AMOUNTS, LOAN_PURPOSES, LOAN_TERMS } from "shared/api/loan";
import type { CredentialFormats, DcApiRequest } from "shared/types/auth";
import type { AuthorizationErrorInfo } from "shared/types/vidos-errors";
import { CredentialDisclosure } from "@/components/auth/credential-disclosure";
import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { QRCodeDisplay } from "@/components/auth/qr-code-display";
import { VerificationStatus } from "@/components/auth/verification-status";
import { VidosErrorDisplay } from "@/components/auth/vidos-error-display";
import {
	AUTH_PAGE_MAX_WIDTH_CLASS,
	AUTH_PAGE_OUTER_CLASS,
} from "@/components/layout/auth-page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getStoredCredentialFormats, getStoredMode } from "@/lib/auth-helpers";
import { useDebugConsole } from "@/lib/debug-console-context";
import { useAuthorizationStream } from "@/lib/use-authorization-stream";

import { cn } from "@/lib/utils";

// Purpose icons mapping
const PURPOSE_ICONS: Record<string, React.ElementType> = {
	Car: Car,
	"Home Improvement": Home,
	Education: GraduationCap,
	Other: Briefcase,
};

export const Route = createFileRoute("/_app/_auth/loan/")({
	component: LoanPage,
});

type FlowState =
	| { status: "form" }
	| { status: "review" }
	| {
			status: "verifying";
			mode: "direct_post";
			requestId: string;
			authorizeUrl: string;
			credentialFormats: CredentialFormats;
			requestedClaims: string[];
			purpose: string;
	  }
	| {
			status: "verifying";
			mode: "dc_api";
			requestId: string;
			dcApiRequest: DcApiRequest;
			credentialFormats: CredentialFormats;
			requestedClaims: string[];
			purpose: string;
	  }
	| { status: "error"; message: string; errorInfo?: AuthorizationErrorInfo }
	| { status: "expired" };

// Simple interest rate for demo (5.9% APR)
const DEMO_APR = 5.9;

function calculateMonthlyPayment(
	principal: number,
	months: number,
	apr: number,
): number {
	const monthlyRate = apr / 100 / 12;
	if (monthlyRate === 0) return principal / months;
	return (
		(principal * (monthlyRate * (1 + monthlyRate) ** months)) /
		((1 + monthlyRate) ** months - 1)
	);
}

function LoanPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { apiClient } = useRouteContext({ from: "__root__" });
	const [amount, setAmount] = useState<string>("");
	const [purpose, setPurpose] = useState<string>("");
	const [term, setTerm] = useState<string>("");
	const [state, setState] = useState<FlowState>({ status: "form" });
	const { setDebugInfo } = useDebugConsole();

	useEffect(() => {
		if (state.status === "verifying") {
			setDebugInfo(state.requestId);
			return;
		}

		setDebugInfo(null, undefined);
	}, [state, setDebugInfo]);

	const isFormValid = amount && purpose && term;

	// Calculate loan details
	const loanAmount = amount ? Number(amount) : 0;
	const loanTerm = term ? Number(term) : 0;
	const monthlyPayment =
		loanAmount && loanTerm
			? calculateMonthlyPayment(loanAmount, loanTerm, DEMO_APR)
			: 0;
	const totalPayment = monthlyPayment * loanTerm;
	const totalInterest = totalPayment - loanAmount;

	const handleContinue = () => {
		setState({ status: "review" });
	};

	const handleBack = () => {
		setState({ status: "form" });
	};

	// Mutation for submitting loan request
	const requestMutation = useMutation({
		mutationFn: async () => {
			const mode = getStoredMode();
			const credentialFormats = getStoredCredentialFormats();
			const baseParams = {
				amount: amount as "5000" | "10000" | "25000" | "50000",
				purpose: purpose as "Car" | "Home Improvement" | "Education" | "Other",
				term: term as "12" | "24" | "36" | "48",
				credentialFormats,
			};

			const res = await apiClient.api.loan.request.$post({
				json:
					mode === "dc_api"
						? {
								...baseParams,
								mode: "dc_api" as const,
								origin: window.location.origin,
							}
						: { ...baseParams, mode: "direct_post" as const },
			});

			if (!res.ok) throw new Error("Failed to create loan request");

			const data = await res.json();
			return { data, credentialFormats };
		},
		onSuccess: ({ data, credentialFormats }) => {
			if (data.mode === "direct_post") {
				setState({
					status: "verifying",
					mode: "direct_post",
					requestId: data.requestId,
					authorizeUrl: data.authorizeUrl,
					credentialFormats,
					requestedClaims: data.requestedClaims,
					purpose: data.purpose,
				});
			} else {
				setState({
					status: "verifying",
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
		state.status === "verifying" && state.mode === "direct_post"
			? state.requestId
			: null;

	const isDirectPostVerificationActive =
		state.status === "verifying" && state.mode === "direct_post";

	useAuthorizationStream({
		requestId: directPostRequestId,
		streamPath: "/api/loan/stream",
		enabled: isDirectPostVerificationActive,
		withSession: true,
		onEvent: (event, controls) => {
			if (event.eventType === "connected" || event.eventType === "pending") {
				return;
			}

			if (event.eventType === "authorized") {
				queryClient.invalidateQueries({ queryKey: ["user", "me"] });
				navigate({ to: "/loan/success" });
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
			const res = await apiClient.api.loan.complete[":requestId"].$post({
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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user", "me"] });
			navigate({ to: "/loan/success" });
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
		if (state.status !== "verifying") return;
		// Pass data (the actual credential response) not the wrapper object
		completeMutation.mutate({
			requestId: state.requestId,
			response: response.data,
		});
	};

	const handleReset = () => {
		setState({ status: "form" });
	};

	return (
		<div className={AUTH_PAGE_OUTER_CLASS}>
			<div className={`${AUTH_PAGE_MAX_WIDTH_CLASS} mx-auto space-y-6`}>
				<PageHeader
					backLabel={state.status === "review" ? "Edit" : "Dashboard"}
					onBack={state.status === "review" ? handleBack : undefined}
					rightContent={
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<ShieldCheck className="h-4 w-4 text-primary" />
							<span className="font-mono uppercase tracking-wider">
								Personal Loan
							</span>
						</div>
					}
				/>

				{/* Form state */}
				{state.status === "form" && (
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
						{/* Loan configurator card */}
						<div className="lg:col-span-3 rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 lg:p-8 space-y-6">
								<div className="space-y-1">
									<h1 className="text-xl lg:text-2xl font-semibold">
										Configure Your Loan
									</h1>
									<p className="text-sm text-muted-foreground">
										Select the loan parameters that work for you
									</p>
								</div>

								{/* Amount selection - visual cards */}
								<div className="space-y-3">
									<span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-medium">
										<Euro className="h-3.5 w-3.5" />
										Loan Amount
									</span>
									<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
										{LOAN_AMOUNTS.map((a) => (
											<button
												key={a}
												type="button"
												onClick={() => setAmount(a.toString())}
												className={cn(
													"relative p-4 rounded-xl border-2 text-left transition-all",
													"hover:border-primary/40 hover:bg-primary/5",
													amount === a.toString()
														? "border-primary bg-primary/5 ring-2 ring-primary/20"
														: "border-border/60 bg-background",
												)}
											>
												<span className="text-xl font-bold font-mono">
													€{a.toLocaleString()}
												</span>
												{amount === a.toString() && (
													<div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
												)}
											</button>
										))}
									</div>
								</div>

								{/* Purpose selection - icon cards */}
								<div className="space-y-3">
									<span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-medium">
										What's it for?
									</span>
									<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
										{LOAN_PURPOSES.map((p) => {
											const Icon = PURPOSE_ICONS[p] || Briefcase;
											return (
												<button
													key={p}
													type="button"
													onClick={() => setPurpose(p)}
													className={cn(
														"relative p-4 rounded-xl border-2 text-left transition-all",
														"hover:border-primary/40 hover:bg-primary/5",
														"flex flex-col gap-2",
														purpose === p
															? "border-primary bg-primary/5 ring-2 ring-primary/20"
															: "border-border/60 bg-background",
													)}
												>
													<div
														className={cn(
															"h-9 w-9 rounded-lg flex items-center justify-center",
															purpose === p
																? "bg-primary text-primary-foreground"
																: "bg-muted",
														)}
													>
														<Icon className="h-4.5 w-4.5" />
													</div>
													<span className="font-medium text-sm">{p}</span>
													{purpose === p && (
														<div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
													)}
												</button>
											);
										})}
									</div>
								</div>

								{/* Term selection - segmented buttons */}
								<div className="space-y-3">
									<span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-medium">
										Repayment Term
									</span>
									<div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
										{LOAN_TERMS.map((t) => (
											<button
												key={t}
												type="button"
												onClick={() => setTerm(t.toString())}
												className={cn(
													"flex-1 py-3 px-2 rounded-lg font-medium text-sm transition-all",
													term === t.toString()
														? "bg-background text-foreground shadow-sm"
														: "text-muted-foreground hover:text-foreground",
												)}
											>
												{t} mo
											</button>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Right sidebar - calculator preview & info */}
						<div className="lg:col-span-2 space-y-6">
							{/* Calculator preview */}
							<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
								<div className="p-6 lg:p-8">
									<div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
										<Calculator className="h-4 w-4" />
										<span className="font-medium">Estimated Payment</span>
									</div>
									{isFormValid ? (
										<>
											<div className="flex items-baseline gap-1">
												<span className="text-4xl lg:text-5xl font-bold font-mono">
													€{monthlyPayment.toFixed(2)}
												</span>
												<span className="text-muted-foreground">/month</span>
											</div>
											<p className="text-sm text-muted-foreground mt-3">
												{DEMO_APR}% APR representative
											</p>
											<div className="mt-6 pt-4 border-t border-border/40 space-y-2">
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Total Interest
													</span>
													<span className="font-mono">
														€{totalInterest.toFixed(2)}
													</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Total Repayment
													</span>
													<span className="font-mono font-medium">
														€{totalPayment.toFixed(2)}
													</span>
												</div>
											</div>
										</>
									) : (
										<div className="py-8 text-center text-muted-foreground">
											<p className="text-sm">
												Select loan options to see estimate
											</p>
										</div>
									)}
								</div>
								<div className="px-6 lg:px-8 pb-6 lg:pb-8">
									<Button
										onClick={handleContinue}
										className="w-full h-12 text-base"
										disabled={!isFormValid}
									>
										Review Application
									</Button>
								</div>
							</div>

							{/* Info */}
							<div className="rounded-xl bg-primary/5 border border-primary/20 p-4 lg:p-6">
								<div className="flex items-start gap-3">
									<div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
										<Fingerprint className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
									</div>
									<div className="space-y-1">
										<p className="text-sm lg:text-base font-medium">
											Instant Decision
										</p>
										<p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
											Your PID credential provides verified identity — no
											documents to upload, no lengthy forms to fill.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Review state */}
				{state.status === "review" && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
						{/* Loan summary card */}
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 lg:p-8 space-y-4">
								<h2 className="text-lg lg:text-xl font-semibold">
									Loan Summary
								</h2>

								{/* Principal amount - large display */}
								<div className="py-6 lg:py-8 text-center">
									<p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
										Loan Amount
									</p>
									<p className="text-4xl lg:text-5xl font-bold font-mono tracking-tight">
										€{loanAmount.toLocaleString()}
									</p>
								</div>

								{/* Details grid */}
								<div className="grid grid-cols-2 gap-4 py-4 border-t border-border/40">
									<div className="text-center p-4 rounded-lg bg-muted/30">
										<p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
											Monthly
										</p>
										<p className="text-xl lg:text-2xl font-bold font-mono">
											€{monthlyPayment.toFixed(2)}
										</p>
									</div>
									<div className="text-center p-4 rounded-lg bg-muted/30">
										<p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
											Term
										</p>
										<p className="text-xl lg:text-2xl font-bold font-mono">
											{loanTerm} mo
										</p>
									</div>
								</div>

								{/* Additional details */}
								<div className="space-y-3 pt-4 border-t border-border/40">
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Purpose
										</span>
										<span className="font-medium">{purpose}</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground flex items-center gap-1.5">
											<Percent className="h-3.5 w-3.5" />
											APR
										</span>
										<span className="font-medium font-mono">{DEMO_APR}%</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Total Interest
										</span>
										<span className="font-medium font-mono">
											€{totalInterest.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between items-center pt-2 border-t border-border/40">
										<span className="text-sm font-medium">Total Repayment</span>
										<span className="font-bold font-mono">
											€{totalPayment.toFixed(2)}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Action card */}
						<div className="space-y-6">
							<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
								<div className="p-6 lg:p-8">
									<h3 className="text-lg font-semibold mb-4">
										Ready to Submit
									</h3>
									<p className="text-sm text-muted-foreground mb-6">
										Verify your identity using your PID credential to complete
										the application. No documents needed.
									</p>
									<Button
										onClick={() => requestMutation.mutate()}
										disabled={requestMutation.isPending}
										className="w-full h-12 text-base group"
									>
										{requestMutation.isPending ? (
											<>
												<Loader2 className="mr-2 h-5 w-5 animate-spin" />
												Creating application...
											</>
										) : (
											<>
												<Fingerprint className="mr-2 h-5 w-5" />
												Verify & Submit
											</>
										)}
									</Button>
								</div>
							</div>

							{/* Terms notice */}
							<p className="text-xs text-center text-muted-foreground">
								By submitting, you agree to verify your identity using your PID
								credential. Your identity data will be used for verification
								only.
							</p>
						</div>
					</div>
				)}

				{/* Verifying state - Direct Post */}
				{state.status === "verifying" && state.mode === "direct_post" && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 lg:p-8 space-y-4">
								<div className="text-center lg:text-left">
									<h2 className="text-lg font-semibold">
										Verify Your Identity
									</h2>
									<p className="text-sm text-muted-foreground">
										Scan with your wallet app to complete
									</p>
								</div>

								{/* Loan summary reminder */}
								<div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg">
									<span className="text-sm text-muted-foreground">
										Loan Amount
									</span>
									<span className="font-bold font-mono">
										€{loanAmount.toLocaleString()}
									</span>
								</div>

								<CredentialDisclosure
									credentialFormats={state.credentialFormats}
									requestedClaims={state.requestedClaims}
									purpose={state.purpose}
								/>
							</div>
						</div>
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 lg:p-8 space-y-4">
								<QRCodeDisplay url={state.authorizeUrl} />
								<VerificationStatus onCancel={handleReset} />
							</div>
						</div>
					</div>
				)}

				{/* Verifying state - DC API */}
				{state.status === "verifying" && state.mode === "dc_api" && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 lg:p-8 space-y-4">
								<div className="text-center lg:text-left">
									<h2 className="text-lg font-semibold">
										Verify Your Identity
									</h2>
									<p className="text-sm text-muted-foreground">
										Confirm with your browser wallet
									</p>
								</div>

								{/* Loan summary reminder */}
								<div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg">
									<span className="text-sm text-muted-foreground">
										Loan Amount
									</span>
									<span className="font-bold font-mono">
										€{loanAmount.toLocaleString()}
									</span>
								</div>

								<CredentialDisclosure
									credentialFormats={state.credentialFormats}
									requestedClaims={state.requestedClaims}
									purpose={state.purpose}
								/>
							</div>
						</div>
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 lg:p-8 space-y-4">
								<DCApiHandler
									dcApiRequest={state.dcApiRequest}
									onSuccess={handleDCApiSuccess}
									onError={(msg) => setState({ status: "error", message: msg })}
								/>
								{completeMutation.isPending && (
									<div className="flex items-center justify-center gap-3 py-4">
										<Loader2 className="h-5 w-5 animate-spin text-primary" />
										<p className="text-muted-foreground">
											Processing application...
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Error state */}
				{state.status === "error" &&
					(state.errorInfo ? (
						<div className="max-w-2xl mx-auto">
							<VidosErrorDisplay
								errorInfo={state.errorInfo}
								onRetry={() => setState({ status: "form" })}
							/>
						</div>
					) : (
						<div className="max-w-2xl mx-auto space-y-4">
							<div
								className={cn(
									"flex items-start gap-3 p-4 lg:p-6 rounded-xl",
									"bg-destructive/10 border border-destructive/20 text-destructive",
								)}
							>
								<AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
								<div className="space-y-1">
									<p className="font-medium">Application Failed</p>
									<p className="text-sm opacity-80">{state.message}</p>
								</div>
							</div>
							<div className="flex gap-3">
								<Button
									onClick={() => setState({ status: "form" })}
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
					))}

				{/* Expired state */}
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
								onClick={() => setState({ status: "form" })}
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
		</div>
	);
}
