import { useMutation, useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import { AlertCircle, Clock, Loader2, UserSearch } from "lucide-react";
import { useState } from "react";
import type { DcApiRequest, PresentationMode } from "shared/types/auth";
import { CredentialDisclosure } from "@/components/auth/credential-disclosure";
import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { ModeSelector } from "@/components/auth/mode-selector";
import { PollingStatus } from "@/components/auth/polling-status";
import { QRCodeDisplay } from "@/components/auth/qr-code-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { setSessionId } from "@/lib/auth";
import { getStoredMode, setStoredMode } from "@/lib/auth-helpers";

export const Route = createFileRoute("/signin")({
	component: SigninPage,
});

type AuthState =
	| { status: "idle" }
	| {
			status: "awaiting_verification";
			mode: "direct_post";
			requestId: string;
			authorizeUrl: string;
			requestedClaims: string[];
			purpose: string;
	  }
	| {
			status: "awaiting_verification";
			mode: "dc_api";
			requestId: string;
			dcApiRequest: DcApiRequest;
			requestedClaims: string[];
			purpose: string;
	  }
	| { status: "success" }
	| { status: "error"; message: string; showSignupLink?: boolean }
	| { status: "expired" };

function SigninPage() {
	const navigate = useNavigate();
	const { apiClient } = useRouteContext({ from: "__root__" });
	const [mode, setMode] = useState<PresentationMode>(getStoredMode);
	const [state, setState] = useState<AuthState>({ status: "idle" });
	const [pollingStartTime] = useState(() => Date.now());

	const handleModeChange = (newMode: PresentationMode) => {
		setMode(newMode);
		setStoredMode(newMode);
	};

	// Mutation for starting signin request
	const requestMutation = useMutation({
		mutationFn: async () => {
			const res = await apiClient.api.signin.request.$post({ json: { mode } });

			if (res.status === 404) {
				throw { type: "not_found" as const };
			}

			if (!res.ok) {
				throw new Error("Failed to create signin request");
			}

			return res.json();
		},
		onSuccess: (data) => {
			console.log("[Signin] request created:", data.requestId);
			if (data.mode === "direct_post") {
				setState({
					status: "awaiting_verification",
					mode: "direct_post",
					requestId: data.requestId,
					authorizeUrl: data.authorizeUrl,
					requestedClaims: data.requestedClaims,
					purpose: data.purpose,
				});
			} else {
				setState({
					status: "awaiting_verification",
					mode: "dc_api",
					requestId: data.requestId,
					dcApiRequest: data.dcApiRequest,
					requestedClaims: data.requestedClaims,
					purpose: data.purpose,
				});
			}
		},
		onError: (err) => {
			console.error("[Signin] error:", err);
			if (
				err &&
				typeof err === "object" &&
				"type" in err &&
				err.type === "not_found"
			) {
				setState({
					status: "error",
					message: "No account found with this identity.",
					showSignupLink: true,
				});
			} else {
				setState({
					status: "error",
					message: err instanceof Error ? err.message : "Unknown error",
				});
			}
		},
	});

	// Polling query for direct_post mode
	const currentRequestId =
		state.status === "awaiting_verification" && state.mode === "direct_post"
			? state.requestId
			: null;

	const pollingQuery = useQuery({
		queryKey: ["signin", "status", currentRequestId],
		queryFn: async () => {
			if (!currentRequestId) throw new Error("No request ID");

			const res = await apiClient.api.signin.status[":requestId"].$get({
				param: { requestId: currentRequestId },
			});

			if (!res.ok) {
				throw new Error("Polling failed");
			}

			return res.json();
		},
		enabled: !!currentRequestId,
		refetchInterval: (query) => {
			// Stop polling after 5 minutes
			if (Date.now() - pollingStartTime > 5 * 60 * 1000) {
				return false;
			}
			// Exponential backoff: start at 1s, max 5s
			const count = query.state.dataUpdateCount;
			return Math.min(1000 * 1.5 ** count, 5000);
		},
	});

	// Handle polling results
	if (pollingQuery.data && state.status === "awaiting_verification") {
		const data = pollingQuery.data;

		if (data.status === "authorized" && data.sessionId) {
			console.log("[Signin] authorized!");
			setSessionId(data.sessionId);
			setStoredMode(data.mode || mode);
			setState({ status: "success" });
			navigate({ to: "/dashboard" });
		} else if (data.status === "not_found") {
			setState({
				status: "error",
				message:
					data.error || "No account found with this identity. Please sign up.",
				showSignupLink: true,
			});
		} else if (data.status === "expired") {
			setState({ status: "expired" });
		} else if (data.status === "rejected" || data.status === "error") {
			setState({
				status: "error",
				message: data.error || `Verification ${data.status}`,
			});
		}
	}

	// Check for timeout
	if (
		state.status === "awaiting_verification" &&
		state.mode === "direct_post" &&
		Date.now() - pollingStartTime > 5 * 60 * 1000
	) {
		setState({ status: "error", message: "Verification timed out" });
	}

	// Mutation for DC API completion
	const completeMutation = useMutation({
		mutationFn: async ({
			requestId,
			response,
		}: {
			requestId: string;
			response: Record<string, unknown>;
		}) => {
			const res = await apiClient.api.signin.complete[":requestId"].$post({
				param: { requestId },
				json: { origin: window.location.origin, dcResponse: response },
			});

			if (res.status === 404) {
				throw { type: "not_found" as const };
			}

			if (!res.ok) {
				throw new Error("Completion failed");
			}

			return res.json();
		},
		onSuccess: (data) => {
			console.log("[Signin] DC API complete success!");
			setSessionId(data.sessionId);
			setStoredMode(data.mode);
			setState({ status: "success" });
			navigate({ to: "/dashboard" });
		},
		onError: (err) => {
			console.error("[Signin] complete error:", err);
			if (
				err &&
				typeof err === "object" &&
				"type" in err &&
				err.type === "not_found"
			) {
				setState({
					status: "error",
					message: "No account found with this identity.",
					showSignupLink: true,
				});
			} else {
				setState({
					status: "error",
					message: err instanceof Error ? err.message : "Completion failed",
				});
			}
		},
	});

	const handleDCApiSuccess = (response: Record<string, unknown>) => {
		if (state.status !== "awaiting_verification") return;
		completeMutation.mutate({ requestId: state.requestId, response });
	};

	const handleCancel = () => {
		setState({ status: "idle" });
	};

	const elapsedSeconds = Math.floor((Date.now() - pollingStartTime) / 1000);

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
										Email Sign-In
									</h2>
									<p className="text-sm text-muted-foreground max-w-md">
										Enter your email and password. This demo shows what
										traditional login looks like—fields are non-functional.
									</p>
								</div>

								<div className="flex-1 flex flex-col justify-center space-y-4">
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
											autoComplete="current-password"
											className="bg-background/50 backdrop-blur-sm opacity-60 cursor-not-allowed"
											disabled
										/>
									</div>
								</div>

								<div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
									<p className="text-xs text-muted-foreground leading-relaxed">
										<span className="font-semibold text-foreground/70">
											Demo Notice:
										</span>{" "}
										These fields are disabled. They represent the traditional
										password-based authentication.
									</p>
								</div>

								<div className="mt-6 text-center">
									<p className="text-xs text-muted-foreground">
										Don't have an account?{" "}
										<Link
											to="/signup"
											className="text-primary hover:underline font-medium"
										>
											Create one now
										</Link>
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
										Wallet Sign-In
									</h2>
									<p className="text-sm text-muted-foreground max-w-md">
										Sign in instantly with your EU Digital Identity Wallet. No
										passwords, just secure verification.
									</p>
								</div>

								<div className="flex-1 flex flex-col justify-center space-y-6">
									<div className="space-y-4">
										<div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-primary/10">
											<div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
											<div>
												<p className="text-sm font-medium text-foreground mb-1">
													Passwordless
												</p>
												<p className="text-xs text-muted-foreground">
													No passwords to remember or manage. Your wallet is
													your key.
												</p>
											</div>
										</div>
										<div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-primary/10">
											<div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
											<div>
												<p className="text-sm font-medium text-foreground mb-1">
													Phishing Resistant
												</p>
												<p className="text-xs text-muted-foreground">
													Cryptographic authentication prevents phishing
													attacks.
												</p>
											</div>
										</div>
										<div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-primary/10">
											<div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
											<div>
												<p className="text-sm font-medium text-foreground mb-1">
													One Tap Access
												</p>
												<p className="text-xs text-muted-foreground">
													Authenticate instantly with a single wallet
													interaction.
												</p>
											</div>
										</div>
									</div>

									<div className="pt-6 space-y-4">
										<ModeSelector value={mode} onChange={handleModeChange} />
										<Button
											onClick={() => requestMutation.mutate()}
											disabled={requestMutation.isPending}
											className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
											size="lg"
										>
											{requestMutation.isPending ? (
												<>
													<Loader2 className="mr-2 h-5 w-5 animate-spin" />
													Creating request...
												</>
											) : (
												"Continue with Wallet →"
											)}
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

				{state.status === "awaiting_verification" &&
					state.mode === "direct_post" && (
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
					state.mode === "dc_api" && (
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
								{completeMutation.isPending && (
									<div className="flex items-center justify-center gap-3 py-4 mt-4">
										<Loader2 className="h-5 w-5 animate-spin text-primary" />
										<p className="text-muted-foreground">
											Completing verification...
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					)}

				{state.status === "error" && (
					<Card className="w-full max-w-2xl mx-auto animate-slide-up">
						<CardContent className="p-12">
							{state.showSignupLink ? (
								<div className="space-y-6 text-center">
									<div className="flex justify-center">
										<div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
											<UserSearch className="w-12 h-12 text-muted-foreground" />
										</div>
									</div>
									<div className="space-y-2">
										<h3 className="text-2xl font-bold text-foreground">
											Account Not Found
										</h3>
										<p className="text-sm text-muted-foreground max-w-md mx-auto">
											{state.message}
										</p>
									</div>
									<div className="flex flex-col gap-3 max-w-sm mx-auto">
										<Button
											asChild
											className="w-full h-12 text-base font-semibold"
											size="lg"
										>
											<Link to="/signup">Create Account</Link>
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
