import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { hcWithType } from "server/client";

import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { PollingStatus } from "@/components/auth/polling-status";
import { QRCodeDisplay } from "@/components/auth/qr-code-display";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getSessionId } from "@/lib/auth";
import { getStoredMode } from "@/lib/auth-helpers";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const client = hcWithType(SERVER_URL);

interface ConfirmSearchParams {
	recipient: string;
	amount: string; // EUR format string "123.45"
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

	// DC API completion handler
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
		<div className="max-w-xl mx-auto px-4 py-8">
			<Card>
				<CardHeader>
					<CardTitle>Confirm Payment</CardTitle>
					<CardDescription>
						Review transaction details and verify with your EUDI Wallet
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Transaction Summary */}
					<div className="bg-muted p-4 rounded-lg space-y-2">
						<h3 className="font-semibold">Transaction Details</h3>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div className="text-muted-foreground">Recipient:</div>
							<div className="font-medium">{search.recipient}</div>
							<div className="text-muted-foreground">Amount:</div>
							<div className="font-medium">EUR {search.amount}</div>
							{search.reference && (
								<>
									<div className="text-muted-foreground">Reference:</div>
									<div className="font-medium">{search.reference}</div>
								</>
							)}
						</div>
					</div>

					{/* Idle State */}
					{state.status === "idle" && (
						<Button onClick={startPaymentVerification} className="w-full">
							Confirm with EUDI Wallet
						</Button>
					)}

					{/* Requesting State */}
					{state.status === "requesting" && (
						<div className="flex items-center justify-center gap-2 py-8">
							<Loader2 className="h-6 w-6 animate-spin" />
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
						<div className="flex items-center justify-center gap-2 py-8">
							<Loader2 className="h-6 w-6 animate-spin" />
							<p className="text-muted-foreground">Processing payment...</p>
						</div>
					)}

					{/* Error State */}
					{state.status === "error" && (
						<div className="space-y-4">
							<Alert variant="destructive">
								<AlertDescription>{state.message}</AlertDescription>
							</Alert>
							<div className="flex gap-2">
								<Button
									onClick={() => navigate({ to: "/send" })}
									variant="outline"
								>
									Start Over
								</Button>
								<Button onClick={startPaymentVerification}>Retry</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
