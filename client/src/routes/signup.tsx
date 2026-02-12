import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { hcWithType } from "server/client";
import type { PresentationMode } from "shared/types/auth";
import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { ModeSelector } from "@/components/auth/mode-selector";
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
import { setSessionId } from "@/lib/auth";
import { getStoredMode, setStoredMode } from "@/lib/auth-helpers";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const client = hcWithType(SERVER_URL);

export const Route = createFileRoute("/signup")({
	component: SignupPage,
});

type AuthState =
	| { status: "idle" }
	| { status: "requesting" }
	| {
			status: "awaiting_verification";
			requestId: string;
			authorizeUrl?: string;
			dcApiRequest?: Record<string, unknown>;
	  }
	| { status: "completing" }
	| { status: "success" }
	| { status: "error"; message: string };

function SignupPage() {
	const navigate = useNavigate();
	const [mode, setMode] = useState<PresentationMode>(getStoredMode);
	const [state, setState] = useState<AuthState>({ status: "idle" });
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	const handleModeChange = (newMode: PresentationMode) => {
		setMode(newMode);
		setStoredMode(newMode);
	};

	const startSignup = async () => {
		setState({ status: "requesting" });

		try {
			const res = await client.api.signup.request.$post({ json: { mode } });
			if (!res.ok) throw new Error("Failed to create signup request");

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
			try {
				const res = await client.api.signup.status[":requestId"].$get({
					param: { requestId: state.requestId },
				});

				if (!res.ok) throw new Error("Polling failed");

				const data = await res.json();

				if (data.status === "authorized" && data.sessionId) {
					setSessionId(data.sessionId);
					setStoredMode(data.mode || mode);
					setState({ status: "success" });
					navigate({ to: "/profile" });
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

				// Check timeout
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
	}, [state, mode, navigate]);

	// DC API completion handler
	const handleDCApiSuccess = async (response: Record<string, unknown>) => {
		if (state.status !== "awaiting_verification") return;

		setState({ status: "completing" });
		try {
			const res = await client.api.signup.complete[":requestId"].$post({
				param: { requestId: state.requestId },
				json: { origin: window.location.origin, dcResponse: response },
			});

			if (!res.ok) throw new Error("Completion failed");

			const data = await res.json();
			setSessionId(data.sessionId);
			setStoredMode(data.mode);
			setState({ status: "success" });
			navigate({ to: "/profile" });
		} catch (err) {
			setState({
				status: "error",
				message: err instanceof Error ? err.message : "Completion failed",
			});
		}
	};

	const handleCancel = () => {
		setState({ status: "idle" });
		setElapsedSeconds(0);
	};

	return (
		<div className="flex-1 flex items-center justify-center px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Create Account</CardTitle>
					<CardDescription>
						Sign up with your EU Digital Identity Wallet
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{state.status === "idle" && (
						<>
							<ModeSelector value={mode} onChange={handleModeChange} />
							<Button onClick={startSignup} className="w-full" size="lg">
								Continue with Wallet
							</Button>
						</>
					)}

					{state.status === "requesting" && (
						<div className="flex justify-center py-8">
							<Loader2 className="w-8 h-8 animate-spin" />
						</div>
					)}

					{state.status === "awaiting_verification" &&
						mode === "direct_post" &&
						state.authorizeUrl && (
							<>
								<QRCodeDisplay url={state.authorizeUrl} />
								<PollingStatus
									elapsedSeconds={elapsedSeconds}
									onCancel={handleCancel}
								/>
							</>
						)}

					{state.status === "awaiting_verification" &&
						mode === "dc_api" &&
						state.dcApiRequest && (
							<DCApiHandler
								dcApiRequest={state.dcApiRequest}
								onSuccess={handleDCApiSuccess}
								onError={(msg) => setState({ status: "error", message: msg })}
							/>
						)}

					{state.status === "completing" && (
						<div className="flex justify-center py-8">
							<Loader2 className="w-8 h-8 animate-spin" />
						</div>
					)}

					{state.status === "error" && (
						<>
							<Alert variant="destructive">
								<AlertDescription>{state.message}</AlertDescription>
							</Alert>
							<Button
								onClick={handleCancel}
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
