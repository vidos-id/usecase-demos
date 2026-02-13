import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, UserX } from "lucide-react";
import type { PresentationMode } from "shared/types/auth";
import {
	AuthFlow,
	type AuthFlowConfig,
	AuthFooter,
	type AuthState,
	WalletFeatureItem,
} from "@/components/auth/auth-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/signup")({
	component: SignupPage,
});

function SignupPage() {
	const { apiClient } = useRouteContext({ from: "__root__" });

	const config: AuthFlowConfig = {
		flowKey: "signup",

		api: {
			createRequest: async (
				params: { mode: "direct_post" } | { mode: "dc_api"; origin: string },
			) => {
				const res = await apiClient.api.signup.request.$post({
					json: params,
				});

				if (!res.ok) {
					throw new Error("Failed to create signup request");
				}

				return res.json();
			},

			pollStatus: async (requestId: string) => {
				const res = await apiClient.api.signup.status[":requestId"].$get({
					param: { requestId },
				});

				if (!res.ok) {
					throw new Error("Polling failed");
				}

				return res.json();
			},

			completeRequest: async (
				requestId: string,
				response: Record<string, unknown>,
				origin: string,
			) => {
				const res = await apiClient.api.signup.complete[":requestId"].$post({
					param: { requestId },
					json: { origin, dcResponse: response },
				});

				if (!res.ok) {
					if (res.status === 400) {
						throw { type: "account_exists" as const };
					}
					throw new Error("Completion failed");
				}

				return res.json();
			},
		},

		onSuccess: (_sessionId: string, _mode: PresentationMode) => {
			// Success state shows card with "Sign In" link - no navigation
		},

		mapPollingResult: (
			result,
		): { handled: true; state: AuthState } | { handled: false } => {
			if (result.status === "account_exists") {
				return {
					handled: true,
					state: {
						status: "error",
						message:
							"An account with this identity already exists. Please sign in instead or delete your existing account first.",
						errorType: "account_exists",
					},
				};
			}
			return { handled: false };
		},

		mapCompleteError: (
			err,
		): { handled: true; state: AuthState } | { handled: false } => {
			if (
				err &&
				typeof err === "object" &&
				"type" in err &&
				err.type === "account_exists"
			) {
				return {
					handled: true,
					state: {
						status: "error",
						message:
							"An account with this identity already exists. Please sign in instead or delete your existing account first.",
						errorType: "account_exists",
					},
				};
			}
			return { handled: false };
		},

		labels: {
			rightPanelTitle: "Wallet Sign-Up",
			rightPanelDescription:
				"Verify instantly with your EU Digital Identity Wallet. Secure, private, and compliant with eIDAS 2.0.",
			buttonText: "Continue with Wallet →",
			buttonLoadingText: "Creating request...",
		},

		slots: {
			leftPanel: <SignupLeftPanel />,
			walletFeatures: <SignupWalletFeatures />,
			footer: <AuthFooter />,
			successContent: (_sessionId) => (
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
								<Link to="/signin">Sign In to Continue →</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			),
			errorContent: (message, errorType, onRetry) => {
				if (errorType === "account_exists") {
					return (
						<Card className="w-full max-w-2xl mx-auto animate-slide-up">
							<CardContent className="p-12">
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
											{message}
										</p>
									</div>
									<div className="flex flex-col gap-3 max-w-sm mx-auto">
										<Button
											asChild
											className="w-full h-12 text-base font-semibold"
											size="lg"
										>
											<Link to="/signin">Sign In Instead</Link>
										</Button>
										<Button
											onClick={onRetry}
											variant="outline"
											className="w-full"
										>
											Try Again
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				}

				// Default error
				return (
					<Card className="w-full max-w-2xl mx-auto animate-slide-up">
						<CardContent className="p-12">
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
										{message}
									</p>
								</div>
								<Button
									onClick={onRetry}
									variant="outline"
									className="w-full max-w-sm mx-auto"
								>
									Try Again
								</Button>
							</div>
						</CardContent>
					</Card>
				);
			},
		},
	};

	return <AuthFlow config={config} />;
}

function SignupLeftPanel() {
	return (
		<>
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
					Enter your details manually. This demo shows what traditional sign-up
					looks like—fields are non-functional.
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
					<span className="font-semibold text-foreground/70">Demo Notice:</span>{" "}
					These fields are disabled. They represent the traditional multi-step
					verification process.
				</p>
			</div>
		</>
	);
}

function SignupWalletFeatures() {
	return (
		<>
			<WalletFeatureItem
				title="Instant Verification"
				description="No manual data entry. Your wallet provides verified credentials automatically."
			/>
			<WalletFeatureItem
				title="Privacy First"
				description="Selective disclosure—share only what's needed, nothing more."
			/>
			<WalletFeatureItem
				title="EU Compliant"
				description="Built on eIDAS 2.0 standards for cross-border interoperability."
			/>
		</>
	);
}
