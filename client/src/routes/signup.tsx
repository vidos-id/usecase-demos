import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { CheckCircle2, UserX } from "lucide-react";
import { useMemo } from "react";
import type { PresentationMode } from "shared/types/auth";
import type { AuthorizationErrorInfo } from "shared/types/vidos-errors";
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
import { createStreamUrl } from "@/lib/sse";

export const Route = createFileRoute("/signup")({
	component: SignupPage,
});

function SignupPage() {
	const { apiClient } = useRouteContext({ from: "__root__" });

	const config = useMemo<AuthFlowConfig>(
		() => ({
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

				createStreamUrl: (requestId: string) => {
					return createStreamUrl(`/api/signup/stream/${requestId}`);
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
							// Try to parse error response with errorInfo
							try {
								const errorBody = (await res.json()) as {
									error?: string;
									errorInfo?: unknown;
								};
								if (errorBody.errorInfo) {
									throw {
										type: "vidos_error" as const,
										errorInfo: errorBody.errorInfo,
									};
								}
							} catch {
								// If parsing fails, throw generic account exists error
							}
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

			mapCompleteError: (err) => mapAccountExistsError(err),

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
				successContent: () => <SuccessCard />,
				errorContent: (message, errorType, onRetry) =>
					errorType === "account_exists" ? (
						<AccountExistsError message={message} onRetry={onRetry} />
					) : null, // Return null to let AuthFlow handle Vidos errors with VidosErrorDisplay
			},
		}),
		[apiClient],
	);

	return <AuthFlow config={config} />;
}

// ============================================================================
// Helpers
// ============================================================================

function mapAccountExistsError(
	err: unknown,
): { handled: true; state: AuthState } | { handled: false } {
	if (err && typeof err === "object" && "type" in err) {
		const typedErr = err as {
			type: string;
			errorInfo?: AuthorizationErrorInfo;
		};

		// Handle Vidos validation errors
		if (typedErr.type === "vidos_error" && typedErr.errorInfo) {
			return {
				handled: true,
				state: {
					status: "error",
					message: "Verification failed",
					errorInfo: typedErr.errorInfo,
				},
			};
		}

		// Handle account exists error
		if (typedErr.type === "account_exists") {
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
	}
	return { handled: false };
}

// ============================================================================
// Slot Components
// ============================================================================

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
				title="Instant KYC"
				description="PID credentials replace manual document upload. Verified identity in seconds."
			/>
			<WalletFeatureItem
				title="Selective Disclosure"
				description="Share only required attributes. GDPR-compliant data minimization built in."
			/>
			<WalletFeatureItem
				title="Cross-Border Ready"
				description="Works with any EU Member State wallet. One integration, 27 countries."
			/>
		</>
	);
}

// ============================================================================
// Success/Error Components
// ============================================================================

function SuccessCard() {
	return (
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
							Your identity was verified via PID credential. No forms, no
							document uploads — just your EUDI Wallet.
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
	);
}

function AccountExistsError({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	return (
		<Card className="w-full max-w-2xl mx-auto animate-slide-up">
			<CardContent className="p-12">
				<div className="space-y-6 text-center">
					<div className="flex justify-center">
						<div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
							<UserX className="w-12 h-12 text-amber-600" />
						</div>
					</div>
					<div className="space-y-3">
						<h3 className="text-2xl font-bold text-foreground">
							Account Already Exists
						</h3>
						<p className="text-sm text-muted-foreground max-w-md mx-auto">
							{message}
						</p>
						<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 max-w-md mx-auto text-left">
							<p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
								<span className="font-semibold">Why did this happen?</span> You
								may have already signed up with this credential, or another user
								shares the same identifier. This demo uses the personal
								identification number from your PID credential as a unique
								identifier — test wallets like Multipaz or shared EUDI test
								identities often have the same value.
							</p>
							<p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed mt-2">
								If this is your account, simply proceed with{" "}
								<span className="font-semibold">Sign In</span> below.
							</p>
						</div>
					</div>
					<div className="flex flex-col gap-3 max-w-sm mx-auto">
						<Button
							asChild
							className="w-full h-12 text-base font-semibold"
							size="lg"
						>
							<Link to="/signin">Sign In Instead</Link>
						</Button>
						<Button onClick={onRetry} variant="outline" className="w-full">
							Try Again
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
