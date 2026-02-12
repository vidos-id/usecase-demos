import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
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
	| { status: "success"; sessionId: string }
	| { status: "error"; message: string };

function SignupPage() {
	const [mode, setMode] = useState<PresentationMode>(getStoredMode);
	const [state, setState] = useState<AuthState>({ status: "idle" });
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	const handleModeChange = (newMode: PresentationMode) => {
		setMode(newMode);
		setStoredMode(newMode);
	};

	const startSignup = async () => {
		setState({ status: "requesting" });
		console.log("[Signup] starting request, mode:", mode);

		try {
			const res = await client.api.signup.request.$post({ json: { mode } });
			if (!res.ok) {
				console.error("[Signup] request failed:", res.status, await res.text());
				throw new Error("Failed to create signup request");
			}

			const data = await res.json();
			console.log("[Signup] request created:", data.requestId);
			setState({
				status: "awaiting_verification",
				requestId: data.requestId,
				authorizeUrl:
					data.mode === "direct_post" ? data.authorizeUrl : undefined,
				dcApiRequest: data.mode === "dc_api" ? data.dcApiRequest : undefined,
			});
		} catch (err) {
			console.error("[Signup] error:", err);
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

				if (!res.ok) {
					console.error("[Signup] poll failed:", res.status, await res.text());
					throw new Error("Polling failed");
				}

				const data = await res.json();
				console.log("[Signup] poll status:", data.status);

				if (data.status === "authorized" && data.sessionId) {
					console.log("[Signup] authorized!");
					setStoredMode(data.mode || mode);
					setState({ status: "success", sessionId: data.sessionId });
					return;
				}

				if (
					data.status === "rejected" ||
					data.status === "error" ||
					data.status === "expired"
				) {
					console.error("[Signup] verification failed:", data.status);
					setState({ status: "error", message: `Verification ${data.status}` });
					return;
				}

				if (data.status === "account_exists") {
					console.log("[Signup] account already exists");
					setState({
						status: "error",
						message:
							"account_exists:An account with this identity already exists. Please sign in instead or delete your existing account first.",
					});
					return;
				}

				// Check timeout
				if (Date.now() - startTime > timeout) {
					console.error("[Signup] timed out");
					setState({ status: "error", message: "Verification timed out" });
					return;
				}

				setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
				interval = Math.min(interval * 1.5, maxInterval);
				timeoutId = setTimeout(poll, interval);
			} catch (err) {
				console.error("[Signup] poll error:", err);
				setState({
					status: "error",
					message: err instanceof Error ? err.message : "Polling failed",
				});
			}
		};

		poll();
		return () => clearTimeout(timeoutId);
	}, [state, mode]);

	// DC API completion handler
	const handleDCApiSuccess = async (response: Record<string, unknown>) => {
		if (state.status !== "awaiting_verification") return;

		setState({ status: "completing" });
		console.log("[Signup] completing DC API flow");
		try {
			const res = await client.api.signup.complete[":requestId"].$post({
				param: { requestId: state.requestId },
				json: { origin: window.location.origin, dcResponse: response },
			});

			if (!res.ok) {
				console.error(
					"[Signup] complete failed:",
					res.status,
					await res.text(),
				);
				// Check if it's account exists error
				if (res.status === 400) {
					setState({
						status: "error",
						message:
							"account_exists:An account with this identity already exists. Please sign in instead or delete your existing account first.",
					});
					return;
				}
				throw new Error("Completion failed");
			}

			const data = await res.json();
			console.log("[Signup] DC API complete success!");
			setStoredMode(data.mode);
			setState({ status: "success", sessionId: data.sessionId });
		} catch (err) {
			console.error("[Signup] complete error:", err);
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

					{state.status === "success" && (
						<div className="space-y-6 text-center">
							<div className="flex justify-center">
								<CheckCircle2 className="w-16 h-16 text-green-600" />
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-semibold text-green-700">
									Account Created Successfully!
								</h3>
								<p className="text-sm text-muted-foreground">
									Your online banking account has been created. Please sign in
									to start using your account.
								</p>
							</div>
							<Button asChild className="w-full" size="lg">
								<a href="/signin">Sign In to Continue</a>
							</Button>
						</div>
					)}

					{state.status === "error" && (
						<>
							<Alert variant="destructive">
								<AlertDescription>
									{state.message.startsWith("account_exists:") ? (
										<div className="space-y-2">
											<p>{state.message.replace("account_exists:", "")}</p>
											<div className="flex gap-2 mt-3">
												<Button asChild variant="outline" size="sm">
													<a href="/signin">Sign In</a>
												</Button>
												<Button asChild variant="outline" size="sm">
													<a href="/delete-account">Delete Account</a>
												</Button>
											</div>
										</div>
									) : (
										state.message
									)}
								</AlertDescription>
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
