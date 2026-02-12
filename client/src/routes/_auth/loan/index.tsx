import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	ArrowRight,
	Banknote,
	Fingerprint,
	Loader2,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { hcWithType } from "server/client";
import { LOAN_AMOUNTS, LOAN_PURPOSES, LOAN_TERMS } from "shared/api/loan";
import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { PollingStatus } from "@/components/auth/polling-status";
import { QRCodeDisplay } from "@/components/auth/qr-code-display";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getSessionId } from "@/lib/auth";
import { getStoredMode } from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const client = hcWithType(SERVER_URL);

export const Route = createFileRoute("/_auth/loan/")({
	component: LoanPage,
});

type FlowState =
	| { status: "form" }
	| { status: "requesting" }
	| {
			status: "verifying";
			requestId: string;
			authorizeUrl?: string;
			dcApiRequest?: Record<string, unknown>;
	  }
	| { status: "error"; message: string };

function LoanPage() {
	const navigate = useNavigate();
	const [amount, setAmount] = useState<string>("");
	const [purpose, setPurpose] = useState<string>("");
	const [term, setTerm] = useState<string>("");
	const [state, setState] = useState<FlowState>({ status: "form" });
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	const sessionId = getSessionId();
	const mode = getStoredMode();
	const isFormValid = amount && purpose && term;

	// Calculate monthly payment estimate
	const monthlyPayment =
		amount && term ? (Number(amount) / Number(term)).toFixed(2) : null;

	const handleSubmit = async () => {
		setState({ status: "requesting" });

		try {
			const res = await client.api.loan.request.$post(
				{
					json: {
						amount: amount as "5000" | "10000" | "25000" | "50000",
						purpose: purpose as
							| "Car"
							| "Home Improvement"
							| "Education"
							| "Other",
						term: term as "12" | "24" | "36" | "48",
					},
				},
				{
					headers: { Authorization: `Bearer ${sessionId}` },
				},
			);

			if (!res.ok) throw new Error("Failed to create loan request");

			const data = await res.json();
			setState({
				status: "verifying",
				requestId: data.requestId,
				authorizeUrl:
					data.mode === "direct_post" ? data.authorizeUrl : undefined,
				dcApiRequest: data.mode === "dc_api" ? data.dcApiRequest : undefined,
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
				const res = await client.api.loan.status[":requestId"].$get(
					{
						param: { requestId: state.requestId },
					},
					{
						headers: { Authorization: `Bearer ${sessionId}` },
					},
				);

				if (!res.ok) throw new Error("Polling failed");

				const data = await res.json();

				if (data.status === "authorized") {
					navigate({ to: "/loan/success" });
					return;
				}

				if (
					data.status === "rejected" ||
					data.status === "error" ||
					data.status === "expired"
				) {
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
	}, [state, mode, navigate, sessionId]);

	const handleDCApiSuccess = async (response: Record<string, unknown>) => {
		if (state.status !== "verifying") return;

		try {
			const res = await client.api.loan.complete[":requestId"].$post(
				{
					param: { requestId: state.requestId },
					json: { origin: window.location.origin, dcResponse: response },
				},
				{
					headers: { Authorization: `Bearer ${sessionId}` },
				},
			);

			if (!res.ok) throw new Error("Completion failed");

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
			<div className="max-w-lg mx-auto space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<Button asChild variant="ghost" size="sm" className="gap-2">
						<Link to="/dashboard">
							<ArrowLeft className="h-4 w-4" />
							Dashboard
						</Link>
					</Button>
					{state.status === "form" && (
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<ShieldCheck className="h-4 w-4 text-primary" />
							<span className="font-mono uppercase tracking-wider">
								Instant Approval
							</span>
						</div>
					)}
				</div>

				{/* Title */}
				<div className="text-center space-y-2">
					<div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-2">
						<Banknote className="h-6 w-6 text-primary" />
					</div>
					<h1 className="text-2xl font-bold tracking-tight">
						Apply for a Loan
					</h1>
					<p className="text-muted-foreground">
						Get approved instantly with your EUDI Wallet
					</p>
				</div>

				{/* Form state */}
				{state.status === "form" && (
					<div className="space-y-6">
						{/* Loan configurator */}
						<div className="rounded-2xl border border-border/60 bg-background p-6 space-y-5">
							<div className="space-y-2">
								<Label className="text-xs uppercase tracking-wider text-muted-foreground">
									Loan Amount
								</Label>
								<Select value={amount} onValueChange={setAmount}>
									<SelectTrigger className="h-12">
										<SelectValue placeholder="Select amount" />
									</SelectTrigger>
									<SelectContent>
										{LOAN_AMOUNTS.map((a) => (
											<SelectItem key={a} value={a.toString()}>
												€{a.toLocaleString()}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label className="text-xs uppercase tracking-wider text-muted-foreground">
									Purpose
								</Label>
								<Select value={purpose} onValueChange={setPurpose}>
									<SelectTrigger className="h-12">
										<SelectValue placeholder="Select purpose" />
									</SelectTrigger>
									<SelectContent>
										{LOAN_PURPOSES.map((p) => (
											<SelectItem key={p} value={p}>
												{p}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label className="text-xs uppercase tracking-wider text-muted-foreground">
									Term
								</Label>
								<Select value={term} onValueChange={setTerm}>
									<SelectTrigger className="h-12">
										<SelectValue placeholder="Select term" />
									</SelectTrigger>
									<SelectContent>
										{LOAN_TERMS.map((t) => (
											<SelectItem key={t} value={t.toString()}>
												{t} months
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Monthly estimate */}
							{monthlyPayment && (
								<div className="pt-4 border-t border-border/40">
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Est. monthly payment
										</span>
										<span className="text-lg font-bold font-mono">
											€{monthlyPayment}
										</span>
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										*Simplified estimate, actual rate may vary
									</p>
								</div>
							)}
						</div>

						<Button
							onClick={handleSubmit}
							className="w-full h-12 text-base group"
							disabled={!isFormValid}
						>
							Submit Application
							<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Button>
					</div>
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
						<div className="rounded-2xl border border-border/60 bg-background p-6 space-y-4">
							<div className="text-center mb-4">
								<h2 className="font-semibold">Verify Your Identity</h2>
								<p className="text-sm text-muted-foreground">
									Scan with your EUDI Wallet to complete the application
								</p>
							</div>
							<QRCodeDisplay url={state.authorizeUrl} />
							<PollingStatus
								elapsedSeconds={elapsedSeconds}
								onCancel={handleReset}
							/>
						</div>
					)}

				{/* Verifying state - DC API */}
				{state.status === "verifying" &&
					mode === "dc_api" &&
					state.dcApiRequest && (
						<div className="rounded-2xl border border-border/60 bg-background p-6">
							<div className="text-center mb-4">
								<h2 className="font-semibold">Verify Your Identity</h2>
								<p className="text-sm text-muted-foreground">
									Confirm with your browser wallet
								</p>
							</div>
							<DCApiHandler
								dcApiRequest={state.dcApiRequest}
								onSuccess={handleDCApiSuccess}
								onError={(msg) => setState({ status: "error", message: msg })}
							/>
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
						<Button onClick={handleReset} variant="outline" className="w-full">
							Try Again
						</Button>
					</div>
				)}

				{/* Info */}
				{state.status === "form" && (
					<div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
						<div className="flex items-start gap-3">
							<div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
								<Fingerprint className="h-4 w-4 text-primary" />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-medium">No Documents Required</p>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Your EUDI Wallet credential contains verified identity
									information. No need to upload documents or fill out lengthy
									forms.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
