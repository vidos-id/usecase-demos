import { useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
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
import { CredentialDisclosure } from "@/components/auth/credential-disclosure";
import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { PollingStatus } from "@/components/auth/polling-status";
import { QRCodeDisplay } from "@/components/auth/qr-code-display";
import { Button } from "@/components/ui/button";
import { getStoredMode } from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";

// Purpose icons mapping
const PURPOSE_ICONS: Record<string, React.ElementType> = {
	Car: Car,
	"Home Improvement": Home,
	Education: GraduationCap,
	Other: Briefcase,
};

export const Route = createFileRoute("/_auth/loan/")({
	component: LoanPage,
});

type FlowState =
	| { status: "form" }
	| { status: "review" }
	| { status: "requesting" }
	| {
			status: "verifying";
			requestId: string;
			authorizeUrl?: string;
			dcApiRequest?: Record<string, unknown>;
			requestedClaims: string[];
			purpose: string;
	  }
	| { status: "error"; message: string }
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
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	const mode = getStoredMode();
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

	const handleSubmit = async () => {
		setState({ status: "requesting" });

		try {
			const res = await apiClient.api.loan.request.$post({
				json: {
					amount: amount as "5000" | "10000" | "25000" | "50000",
					purpose: purpose as
						| "Car"
						| "Home Improvement"
						| "Education"
						| "Other",
					term: term as "12" | "24" | "36" | "48",
				},
			});

			if (!res.ok) throw new Error("Failed to create loan request");

			const data = await res.json();
			setState({
				status: "verifying",
				requestId: data.requestId,
				authorizeUrl:
					data.mode === "direct_post" ? data.authorizeUrl : undefined,
				dcApiRequest: data.mode === "dc_api" ? data.dcApiRequest : undefined,
				requestedClaims: data.requestedClaims,
				purpose: data.purpose,
			});
		} catch (err) {
			setState({
				status: "error",
				message: err instanceof Error ? err.message : "Unknown error",
			});
		}
	};

	// Polling for direct_post mode
	useEffect(() => {
		if (state.status !== "verifying" || mode !== "direct_post") return;

		let interval = 1000;
		const maxInterval = 5000;
		const timeout = 5 * 60 * 1000;
		const startTime = Date.now();
		let timeoutId: ReturnType<typeof setTimeout>;

		const poll = async () => {
			try {
				const res = await apiClient.api.loan.status[":requestId"].$get({
					param: { requestId: state.requestId },
				});

				if (!res.ok) throw new Error("Polling failed");

				const data = await res.json();

				if (data.status === "authorized") {
					queryClient.invalidateQueries({ queryKey: ["user", "me"] });
					navigate({ to: "/loan/success" });
					return;
				}

				if (data.status === "expired") {
					setState({ status: "expired" });
					return;
				}

				if (data.status === "rejected" || data.status === "error") {
					setState({ status: "error", message: `Verification ${data.status}` });
					return;
				}

				if (Date.now() - startTime > timeout) {
					setState({ status: "error", message: "Verification timed out" });
					return;
				}

				setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
				interval = Math.min(interval * 1.5, maxInterval);
				timeoutId = setTimeout(poll, interval);
			} catch (err) {
				setState({
					status: "error",
					message: err instanceof Error ? err.message : "Polling failed",
				});
			}
		};

		poll();
		return () => clearTimeout(timeoutId);
	}, [state, mode, navigate, queryClient, apiClient]);

	const handleDCApiSuccess = async (response: Record<string, unknown>) => {
		if (state.status !== "verifying") return;

		try {
			const res = await apiClient.api.loan.complete[":requestId"].$post({
				param: { requestId: state.requestId },
				json: { origin: window.location.origin, dcResponse: response },
			});

			if (!res.ok) throw new Error("Completion failed");

			queryClient.invalidateQueries({ queryKey: ["user", "me"] });
			navigate({ to: "/loan/success" });
		} catch (err) {
			setState({
				status: "error",
				message: err instanceof Error ? err.message : "Completion failed",
			});
		}
	};

	const handleReset = () => {
		setState({ status: "form" });
		setElapsedSeconds(0);
	};

	return (
		<div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-lg mx-auto space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<Button
						asChild={state.status === "form"}
						variant="ghost"
						size="sm"
						className="gap-2"
						onClick={state.status === "review" ? handleBack : undefined}
					>
						{state.status === "form" ? (
							<Link to="/dashboard">
								<ArrowLeft className="h-4 w-4" />
								Dashboard
							</Link>
						) : state.status === "review" ? (
							<>
								<ArrowLeft className="h-4 w-4" />
								Edit
							</>
						) : (
							<Link to="/dashboard">
								<ArrowLeft className="h-4 w-4" />
								Dashboard
							</Link>
						)}
					</Button>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<ShieldCheck className="h-4 w-4 text-primary" />
						<span className="font-mono uppercase tracking-wider">
							Personal Loan
						</span>
					</div>
				</div>

				{/* Form state */}
				{state.status === "form" && (
					<>
						{/* Loan configurator card */}
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 space-y-6">
								<div className="space-y-1">
									<h1 className="text-xl font-semibold">Configure Your Loan</h1>
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
									<div className="grid grid-cols-2 gap-3">
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
									<div className="grid grid-cols-2 gap-3">
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

							{/* Calculator preview */}
							{isFormValid && (
								<div className="px-6 py-4 bg-muted/30 border-t border-border/40">
									<div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
										<Calculator className="h-4 w-4" />
										<span className="font-medium">Estimated Payment</span>
									</div>
									<div className="flex items-baseline gap-1">
										<span className="text-3xl font-bold font-mono">
											€{monthlyPayment.toFixed(2)}
										</span>
										<span className="text-muted-foreground">/month</span>
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										{DEMO_APR}% APR representative
									</p>
								</div>
							)}
						</div>

						<Button
							onClick={handleContinue}
							className="w-full h-12 text-base"
							disabled={!isFormValid}
						>
							Review Application
						</Button>

						{/* Info */}
						<div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
							<div className="flex items-start gap-3">
								<div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
									<Fingerprint className="h-4 w-4 text-primary" />
								</div>
								<div className="space-y-1">
									<p className="text-sm font-medium">Instant Decision</p>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Your EUDI Wallet provides verified identity — no documents
										to upload, no lengthy forms to fill.
									</p>
								</div>
							</div>
						</div>
					</>
				)}

				{/* Review state */}
				{state.status === "review" && (
					<>
						{/* Loan summary card */}
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 space-y-4">
								<h2 className="text-lg font-semibold">Loan Summary</h2>

								{/* Principal amount - large display */}
								<div className="py-4 text-center">
									<p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
										Loan Amount
									</p>
									<p className="text-4xl font-bold font-mono tracking-tight">
										€{loanAmount.toLocaleString()}
									</p>
								</div>

								{/* Details grid */}
								<div className="grid grid-cols-2 gap-4 py-4 border-t border-border/40">
									<div className="text-center p-3 rounded-lg bg-muted/30">
										<p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
											Monthly
										</p>
										<p className="text-xl font-bold font-mono">
											€{monthlyPayment.toFixed(2)}
										</p>
									</div>
									<div className="text-center p-3 rounded-lg bg-muted/30">
										<p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
											Term
										</p>
										<p className="text-xl font-bold font-mono">{loanTerm} mo</p>
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

							{/* Action area */}
							<div className="p-6 bg-muted/30 border-t border-border/40">
								<Button
									onClick={handleSubmit}
									className="w-full h-12 text-base group"
								>
									<Fingerprint className="mr-2 h-5 w-5" />
									Verify & Submit
								</Button>
							</div>
						</div>

						{/* Terms notice */}
						<p className="text-xs text-center text-muted-foreground">
							By submitting, you agree to verify your identity using your EUDI
							Wallet. Your PID credentials will be used for identity
							verification only.
						</p>
					</>
				)}

				{/* Requesting state */}
				{state.status === "requesting" && (
					<div className="rounded-2xl border border-border/60 bg-background p-8">
						<div className="flex flex-col items-center gap-4">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<p className="text-muted-foreground">
								Creating loan application...
							</p>
						</div>
					</div>
				)}

				{/* Verifying state - Direct Post */}
				{state.status === "verifying" &&
					mode === "direct_post" &&
					state.authorizeUrl && (
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 space-y-4">
								<div className="text-center">
									<h2 className="font-semibold">Verify Your Identity</h2>
									<p className="text-sm text-muted-foreground">
										Scan with your EUDI Wallet to complete
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
									requestedClaims={state.requestedClaims}
									purpose={state.purpose}
								/>
								<QRCodeDisplay url={state.authorizeUrl} />
								<PollingStatus
									elapsedSeconds={elapsedSeconds}
									onCancel={handleReset}
								/>
							</div>
						</div>
					)}

				{/* Verifying state - DC API */}
				{state.status === "verifying" &&
					mode === "dc_api" &&
					state.dcApiRequest && (
						<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
							<div className="p-6 space-y-4">
								<div className="text-center">
									<h2 className="font-semibold">Verify Your Identity</h2>
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
									requestedClaims={state.requestedClaims}
									purpose={state.purpose}
								/>
								<DCApiHandler
									dcApiRequest={state.dcApiRequest}
									onSuccess={handleDCApiSuccess}
									onError={(msg) => setState({ status: "error", message: msg })}
								/>
							</div>
						</div>
					)}

				{/* Error state */}
				{state.status === "error" && (
					<div className="space-y-4">
						<div
							className={cn(
								"flex items-start gap-3 p-4 rounded-xl",
								"bg-destructive/10 border border-destructive/20 text-destructive",
							)}
						>
							<AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="font-medium">Application Failed</p>
								<p className="text-sm opacity-80">{state.message}</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								onClick={() => setState({ status: "form" })}
								variant="outline"
								className="flex-1"
							>
								Start Over
							</Button>
							<Button onClick={handleSubmit} className="flex-1">
								Retry
							</Button>
						</div>
					</div>
				)}

				{/* Expired state */}
				{state.status === "expired" && (
					<div className="space-y-4">
						<div
							className={cn(
								"flex items-start gap-3 p-4 rounded-xl",
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
						<div className="flex gap-2">
							<Button
								onClick={() => setState({ status: "form" })}
								variant="outline"
								className="flex-1"
							>
								Start Over
							</Button>
							<Button onClick={handleSubmit} className="flex-1">
								Retry
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
