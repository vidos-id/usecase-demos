import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock, Loader2, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import type { PresentationMode } from "shared/types/auth";
import { CredentialDisclosure } from "@/components/auth/credential-disclosure";
import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { ModeSelector } from "@/components/auth/mode-selector";
import { PollingStatus } from "@/components/auth/polling-status";
import { QRCodeDisplay } from "@/components/auth/qr-code-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStoredMode, setStoredMode } from "@/lib/auth-helpers";

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
			requestedClaims: string[];
			purpose: string;
	  }
	| { status: "completing" }
	| { status: "success"; sessionId: string }
	| { status: "error"; message: string }
	| { status: "expired" };

function SignupPage() {
	const { apiClient } = useRouteContext({ from: "__root__" });
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
			const res = await apiClient.api.auth.signup.request.$post({ json: { mode } });
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
				requestedClaims: data.requestedClaims,
				purpose: data.purpose,
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
				const res = await apiClient.api.auth.signup.status[":requestId"].$get({
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

				if (data.status === "expired") {
					console.log("[Signup] request expired");
					setState({ status: "expired" });
					return;
				}

				if (data.status === "rejected" || data.status === "error") {
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
	}, [state, mode, apiClient]);

	// DC API completion handler
	const handleDCApiSuccess = async (response: Record<string, unknown>) => {
		if (state.status !== "awaiting_verification") return;

		setState({ status: "completing" });
		console.log("[Signup] completing DC API flow");
		try {
			const res = await apiClient.api.auth.signup.complete[":requestId"].$post({
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
		<div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
			<div className="w-full max-w-6xl">
				{state.status === "idle" && (
					<div className="relative grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
						{/* Traditional Method - Left Panel */}
						<div className="relative bg-gradient-to-br from-muted/30 via-muted/10 to-background p-8 lg:p-12 animate-slide-in-left">
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-muted-foreground/20 to-transparent" />
							<div className="relative z-10 h-full flex flex-col">
								<div className="mb-8">
									<div className="inline-block px-3 py-1 rounded-full bg-muted/50 border border-border mb-4">
										<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
											Traditional Method
										</span>
									</div>
									<h2 className="text-2xl lg:text-3xl font-bold mb-3 text-foreground">
										Manual Registration
									</h2>
									<p className="text-sm text-muted-foreground max-w-md">
										Enter your details manually. This demo shows what
										traditional sign-up looks like—fields are non-functional.
									</p>
								</div>

								<div className="flex-1 space-y-3">
									<div className="grid gap-3">
										<div className="space-y-1.5">
											<span className="text-xs font-medium text-muted-foreground">
												Email Address
											</span>
											<Input
												type="email"
												placeholder="your@email.com"
												autoComplete="email"
												className="bg-background/50 backdrop-blur-sm opacity-60 cursor-not-allowed"
												disabled
											/>
										</div>
										<div className="space-y-1.5">
											<span className="text-xs font-medium text-muted-foreground">
												Password
											</span>
											<Input
												type="password"
												placeholder="••••••••"
												autoComplete="new-password"
												className="bg-background/50 backdrop-blur-sm opacity-60 cursor-not-allowed"
												disabled
											/>
										</div>
									</div>

									<div className="pt-2 border-t border-border/50">
										<p className="text-xs font-medium text-muted-foreground mb-3">
											Personal Information
										</p>
										<div className="grid gap-2.5">
											<Input
												placeholder="Given name"
												autoComplete="given-name"
												className="bg-background/50 backdrop-blur-sm opacity-60 cursor-not-allowed text-sm"
												disabled
											/>
											<Input
												placeholder="Family name"
												autoComplete="family-name"
												className="bg-background/50 backdrop-blur-sm opacity-60 cursor-not-allowed text-sm"
												disabled
											/>
											<Input
												placeholder="Date of birth"
												autoComplete="bday"
												className="bg-background/50 backdrop-blur-sm opacity-60 cursor-not-allowed text-sm"
												disabled
											/>
											<Input
												placeholder="National ID number"
												className="bg-background/50 backdrop-blur-sm opacity-60 cursor-not-allowed text-sm"
												disabled
											/>
											<Input
												placeholder="Nationality"
												autoComplete="country"
												className="bg-background/50 backdrop-blur-sm opacity-60 cursor-not-allowed text-sm"
												disabled
											/>
											<Input
												placeholder="Place of birth"
												className="bg-background/50 backdrop-blur-sm opacity-60 cursor-not-allowed text-sm"
												disabled
											/>
										</div>
									</div>
								</div>

								<div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
									<p className="text-xs text-muted-foreground leading-relaxed">
										<span className="font-semibold text-foreground/70">
											Demo Notice:
										</span>{" "}
										These fields are disabled. They represent the traditional
										multi-step verification process.
									</p>
								</div>
							</div>
						</div>

						{/* Divider */}
						<div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
							<div className="relative flex items-center justify-center">
								<div className="absolute inset-0 bg-background blur-xl" />
								<div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg border-4 border-background">
									<span className="text-sm font-bold text-primary-foreground">
										OR
									</span>
								</div>
							</div>
						</div>

						{/* Mobile Divider */}
						<div className="lg:hidden relative py-6 flex items-center">
							<div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
							<div className="px-4">
								<div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg">
									<span className="text-xs font-bold text-primary-foreground">
										OR
									</span>
								</div>
							</div>
							<div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
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
										Wallet Sign-Up
									</h2>
									<p className="text-sm text-muted-foreground max-w-md">
										Verify instantly with your EU Digital Identity Wallet.
										Secure, private, and compliant with eIDAS 2.0.
									</p>
								</div>

								<div className="flex-1 flex flex-col justify-center space-y-6">
									<div className="space-y-4">
										<div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-primary/10">
											<div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
											<div>
												<p className="text-sm font-medium text-foreground mb-1">
													Instant Verification
												</p>
												<p className="text-xs text-muted-foreground">
													No manual data entry. Your wallet provides verified
													credentials automatically.
												</p>
											</div>
										</div>
										<div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-primary/10">
											<div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
											<div>
												<p className="text-sm font-medium text-foreground mb-1">
													Privacy First
												</p>
												<p className="text-xs text-muted-foreground">
													Selective disclosure—share only what's needed, nothing
													more.
												</p>
											</div>
										</div>
										<div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-primary/10">
											<div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
											<div>
												<p className="text-sm font-medium text-foreground mb-1">
													EU Compliant
												</p>
												<p className="text-xs text-muted-foreground">
													Built on eIDAS 2.0 standards for cross-border
													interoperability.
												</p>
											</div>
										</div>
									</div>

									<div className="pt-6 space-y-4">
										<ModeSelector value={mode} onChange={handleModeChange} />
										<Button
											onClick={startSignup}
											className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
											size="lg"
										>
											Continue with Wallet →
										</Button>
									</div>
								</div>

								<div className="mt-6 text-center">
									<p className="text-xs text-muted-foreground">
										By continuing, you agree to DemoBank's{" "}
										<span className="text-primary hover:underline cursor-pointer">
											Terms
										</span>{" "}
										and{" "}
										<span className="text-primary hover:underline cursor-pointer">
											Privacy Policy
										</span>
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{state.status === "requesting" && (
					<Card className="w-full max-w-2xl mx-auto animate-fade-in">
						<CardContent className="flex justify-center py-16">
							<div className="text-center space-y-4">
								<Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
								<p className="text-sm text-muted-foreground">
									Creating authorization request...
								</p>
							</div>
						</CardContent>
					</Card>
				)}

				{state.status === "awaiting_verification" &&
					mode === "direct_post" &&
					state.authorizeUrl && (
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
					mode === "dc_api" &&
					state.dcApiRequest && (
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
							</CardContent>
						</Card>
					)}

				{state.status === "completing" && (
					<Card className="w-full max-w-2xl mx-auto animate-fade-in">
						<CardContent className="flex justify-center py-16">
							<div className="text-center space-y-4">
								<Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
								<p className="text-sm text-muted-foreground">
									Completing verification...
								</p>
							</div>
						</CardContent>
					</Card>
				)}

				{state.status === "success" && (
					<Card className="w-full max-w-2xl mx-auto animate-slide-up">
						<CardContent className="p-12">
							<div className="space-y-6 text-center">
								<div className="flex justify-center">
									<div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
										<CheckCircle2 className="w-12 h-12 text-green-600" />
									</div>
								</div>
								<div className="space-y-2">
									<h3 className="text-2xl font-bold text-foreground">
										Account Created Successfully!
									</h3>
									<p className="text-sm text-muted-foreground max-w-md mx-auto">
										Your online banking account has been created. Please sign in
										to start using your account.
									</p>
								</div>
								<Button
									asChild
									className="w-full max-w-sm mx-auto h-12 text-base font-semibold"
									size="lg"
								>
									<a href="/signin">Sign In to Continue →</a>
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{state.status === "error" && (
					<Card className="w-full max-w-2xl mx-auto animate-slide-up">
						<CardContent className="p-12">
							{state.message.startsWith("account_exists:") ? (
								<div className="space-y-6 text-center">
									<div className="flex justify-center">
										<div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
											<UserX className="w-12 h-12 text-amber-600" />
										</div>
									</div>
									<div className="space-y-2">
										<h3 className="text-2xl font-bold text-foreground">
											Account Already Exists
										</h3>
										<p className="text-sm text-muted-foreground max-w-md mx-auto">
											{state.message.replace("account_exists:", "")}
										</p>
									</div>
									<div className="flex flex-col gap-3 max-w-sm mx-auto">
										<Button
											asChild
											className="w-full h-12 text-base font-semibold"
											size="lg"
										>
											<a href="/signin">Sign In Instead</a>
										</Button>
										<Button
											onClick={handleCancel}
											variant="outline"
											className="w-full"
										>
											Try Again
										</Button>
									</div>
								</div>
							) : (
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
							)}
						</CardContent>
					</Card>
				)}

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
