import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { hcWithType } from "server/client";
import { LOAN_AMOUNTS, LOAN_PURPOSES, LOAN_TERMS } from "shared/api/loan";
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
				authorizeUrl: data.authorizeUrl,
				dcApiRequest: data.dcApiRequest,
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
		<div className="max-w-xl mx-auto px-4 py-8">
			<Card>
				<CardHeader>
					<CardTitle>Apply for a Loan</CardTitle>
					<CardDescription>
						Get approved instantly with your EUDI Wallet
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{state.status === "form" && (
						<>
							<div className="space-y-2">
								<Label>Loan Amount</Label>
								<Select value={amount} onValueChange={setAmount}>
									<SelectTrigger>
										<SelectValue placeholder="Select amount" />
									</SelectTrigger>
									<SelectContent>
										{LOAN_AMOUNTS.map((a) => (
											<SelectItem key={a} value={a.toString()}>
												EUR {a.toLocaleString()}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Purpose</Label>
								<Select value={purpose} onValueChange={setPurpose}>
									<SelectTrigger>
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
								<Label>Term</Label>
								<Select value={term} onValueChange={setTerm}>
									<SelectTrigger>
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

							<Button
								onClick={handleSubmit}
								className="w-full"
								size="lg"
								disabled={!isFormValid}
							>
								Submit Application
							</Button>
						</>
					)}

					{state.status === "requesting" && (
						<div className="flex justify-center py-8">
							<div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
						</div>
					)}

					{state.status === "verifying" &&
						mode === "direct_post" &&
						state.authorizeUrl && (
							<>
								<QRCodeDisplay url={state.authorizeUrl} />
								<PollingStatus
									elapsedSeconds={elapsedSeconds}
									onCancel={handleReset}
								/>
							</>
						)}

					{state.status === "verifying" &&
						mode === "dc_api" &&
						state.dcApiRequest && (
							<DCApiHandler
								dcApiRequest={state.dcApiRequest}
								onSuccess={handleDCApiSuccess}
								onError={(msg) => setState({ status: "error", message: msg })}
							/>
						)}

					{state.status === "error" && (
						<>
							<Alert variant="destructive">
								<AlertDescription>{state.message}</AlertDescription>
							</Alert>
							<Button
								onClick={handleReset}
								variant="outline"
								className="w-full"
							>
								Try Again
							</Button>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
