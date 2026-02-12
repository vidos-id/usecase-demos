import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Fingerprint,
	Loader2,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { hcWithType } from "server/client";

import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { PollingStatus } from "@/components/auth/polling-status";
import { QRCodeDisplay } from "@/components/auth/qr-code-display";
import { Button } from "@/components/ui/button";
import { getSessionId } from "@/lib/auth";
import { getStoredMode } from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const client = hcWithType(SERVER_URL);

interface ConfirmSearchParams {
	recipient: string;
	amount: string;
	reference?: string;
}

export const Route = createFileRoute("/_auth/send/confirm")({
	validateSearch: (
		search: Record<string, unknown>,
	): ConfirmSearchParams | undefined => {
		if (
			typeof search.recipient === "string" &&
			typeof search.amount === "string"
		) {
			return {
				recipient: search.recipient,
				amount: search.amount,
				reference:
					typeof search.reference === "string" ? search.reference : undefined,
			};
		}
		return undefined;
	},
	component: PaymentConfirmPage,
});

type PaymentState =
	| { status: "idle" }
	| { status: "requesting" }
	| {
			status: "awaiting_verification";
			requestId: string;
			authorizeUrl?: string;
			dcApiRequest?: Record<string, unknown>;
	  }
	| { status: "completing" }
	| { status: "success"; transactionId: string }
	| { status: "error"; message: string };

function PaymentConfirmPage() {
	const navigate = useNavigate();
	const search = Route.useSearch();
	const [state, setState] = useState<PaymentState>({ status: "idle" });
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	const mode = getStoredMode();

	// Polling for direct_post mode
	useEffect(() => {
		if (state.status !== "awaiting_verification" || mode !== "direct_post")
			return;

		let interval = 1000;
		const maxInterval = 5000;
		const timeout = 5 * 60 * 1000;
		const startTime = Date.now();
		let timeoutId: ReturnType<typeof setTimeout>;

		const poll = async () => {
			if (!search) return;

			try {
				const sessionId = getSessionId();
				if (!sessionId) throw new Error("Not authenticated");

				const res = await client.api.payment.status[":requestId"].$get(
					{ param: { requestId: state.requestId } },
					{ headers: { Authorization: `Bearer ${sessionId}` } },
				);

				if (!res.ok) throw new Error("Polling failed");

				const data = await res.json();

				if (data.status === "authorized" && data.transactionId) {
					setState({ status: "success", transactionId: data.transactionId });
					navigate({
						to: "/send/success",
						search: {
							transactionId: data.transactionId,
							recipient: search.recipient,
							amount: search.amount,
							reference: search.reference,
							confirmedAt: new Date().toISOString(),
						},
					});
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
	}, [state, mode, navigate, search]);

	// Redirect if no search params
	useEffect(() => {
		if (!search) {
			navigate({ to: "/send" });
		}
	}, [search, navigate]);

	if (!search) return null;

	const startPaymentVerification = async () => {
		setState({ status: "requesting" });

		try {
			const sessionId = getSessionId();
			if (!sessionId) throw new Error("Not authenticated");

			const res = await client.api.payment.request.$post(
				{
					json: {
						recipient: search.recipient,
						amount: search.amount,
						reference: search.reference,
					},
				},
				{ headers: { Authorization: `Bearer ${sessionId}` } },
			);

			if (!res.ok) throw new Error("Failed to create payment request");

			const data = await res.json();
			setState({
				status: "awaiting_verification",
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

	const handleDCApiSuccess = async (response: Record<string, unknown>) => {
		if (state.status !== "awaiting_verification") return;

		setState({ status: "completing" });
		try {
			const sessionId = getSessionId();
			if (!sessionId) throw new Error("Not authenticated");

			const res = await client.api.payment.complete[":requestId"].$post(
				{
					param: { requestId: state.requestId },
					json: { origin: window.location.origin, dcResponse: response },
				},
				{ headers: { Authorization: `Bearer ${sessionId}` } },
			);

			if (!res.ok) throw new Error("Completion failed");

			const data = await res.json();
			setState({ status: "success", transactionId: data.transactionId });
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
		} catch (err) {
			setState({
				status: "error",
				message: err instanceof Error ? err.message : "Completion failed",
			});
		}
	};

	const handleDCApiError = (error: string) => {
		setState({ status: "error", message: error });
	};

	const handleCancel = () => {
		setState({ status: "idle" });
	};

	return (
		<div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-lg mx-auto space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<Button asChild variant="ghost" size="sm" className="gap-2">
						<Link to="/send">
							<ArrowLeft className="h-4 w-4" />
							Back
						</Link>
					</Button>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<ShieldCheck className="h-4 w-4 text-primary" />
						<span className="font-mono uppercase tracking-wider">
							Secure Payment
						</span>
					</div>
				</div>

				{/* Transaction summary card */}
				<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
					<div className="p-6 space-y-4">
						<h2 className="text-lg font-semibold">Payment Summary</h2>

						{/* Amount - large display */}
						<div className="py-4 text-center">
							<p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
								Amount
							</p>
							<p className="text-4xl font-bold font-mono tracking-tight">
								€{search.amount}
							</p>
						</div>

						{/* Details */}
						<div className="space-y-3 pt-4 border-t border-border/40">
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Recipient</span>
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

					{/* Action area */}
					<div className="p-6 bg-muted/30 border-t border-border/40">
						{/* Idle State */}
						{state.status === "idle" && (
							<Button
								onClick={startPaymentVerification}
								className="w-full h-12 text-base group"
							>
								<Fingerprint className="mr-2 h-5 w-5" />
								Verify with Wallet
							</Button>
						)}

						{/* Requesting State */}
						{state.status === "requesting" && (
							<div className="flex items-center justify-center gap-3 py-4">
								<Loader2 className="h-5 w-5 animate-spin text-primary" />
								<p className="text-muted-foreground">
									Creating payment request...
								</p>
							</div>
						)}

						{/* Awaiting Verification - Direct Post Mode */}
						{state.status === "awaiting_verification" &&
							mode === "direct_post" &&
							state.authorizeUrl && (
								<div className="space-y-4">
									<QRCodeDisplay url={state.authorizeUrl} />
									<PollingStatus
										elapsedSeconds={elapsedSeconds}
										onCancel={handleCancel}
									/>
								</div>
							)}

						{/* Awaiting Verification - DC API Mode */}
						{state.status === "awaiting_verification" &&
							mode === "dc_api" &&
							state.dcApiRequest && (
								<DCApiHandler
									dcApiRequest={state.dcApiRequest}
									onSuccess={handleDCApiSuccess}
									onError={handleDCApiError}
								/>
							)}

						{/* Completing State */}
						{state.status === "completing" && (
							<div className="flex items-center justify-center gap-3 py-4">
								<Loader2 className="h-5 w-5 animate-spin text-primary" />
								<p className="text-muted-foreground">Processing payment...</p>
							</div>
						)}

						{/* Error State */}
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
										<p className="font-medium">Payment Failed</p>
										<p className="text-sm opacity-80">{state.message}</p>
									</div>
								</div>
								<div className="flex gap-2">
									<Button
										onClick={() => navigate({ to: "/send" })}
										variant="outline"
										className="flex-1"
									>
										Start Over
									</Button>
									<Button onClick={startPaymentVerification} className="flex-1">
										Retry
									</Button>
								</div>
							</div>
						)}

						{/* Success State */}
						{state.status === "success" && (
							<div className="flex items-center justify-center gap-3 py-4 text-green-600">
								<CheckCircle2 className="h-6 w-6" />
								<p className="font-medium">Payment Verified</p>
							</div>
						)}
					</div>
				</div>

				{/* Security info */}
				{state.status === "idle" && (
					<p className="text-xs text-center text-muted-foreground">
						Your identity will be verified using your EUDI Wallet credentials.
						No passwords are transmitted.
					</p>
				)}
			</div>
		</div>
	);
}
