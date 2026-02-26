import {
	createFileRoute,
	Link,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import { UserSearch } from "lucide-react";
import { useMemo } from "react";
import type { CredentialFormats, PresentationMode } from "demo-bank-shared/types/auth";
import type { AuthorizationErrorInfo } from "demo-bank-shared/types/vidos-errors";
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
import { setSessionId } from "@/lib/auth";
import { createStreamUrl } from "@/lib/sse";

export const Route = createFileRoute("/_app/signin")({
	component: SigninPage,
});

function SigninPage() {
	const navigate = useNavigate();
	const { apiClient } = useRouteContext({ from: "__root__" });

	const config = useMemo<AuthFlowConfig>(
		() => ({
			flowKey: "signin",

			api: {
				createRequest: async (
					params:
						| { mode: "direct_post"; credentialFormats: CredentialFormats }
						| {
								mode: "dc_api";
								origin: string;
								credentialFormats: CredentialFormats;
						  },
				) => {
					const res = await apiClient.api.signin.request.$post({
						json: params,
					});

					if (res.status === 404) {
						throw { type: "not_found" as const };
					}

					if (!res.ok) {
						throw new Error("Failed to create signin request");
					}

					return res.json();
				},

				createStreamUrl: (requestId: string) => {
					return createStreamUrl(`/api/signin/stream/${requestId}`);
				},

				completeRequest: async (
					requestId: string,
					response: Record<string, unknown>,
					origin: string,
				) => {
					const res = await apiClient.api.signin.complete[":requestId"].$post({
						param: { requestId },
						json: { origin, dcResponse: response },
					});

					if (res.status === 404) {
						throw { type: "not_found" as const };
					}

					if (!res.ok) {
						// Try to parse error response with errorInfo
						if (res.status === 400) {
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
								// If parsing fails, throw generic error
							}
						}
						throw new Error("Completion failed");
					}

					return res.json();
				},
			},

			onSuccess: (sessionId: string, _mode: PresentationMode) => {
				setSessionId(sessionId);
				navigate({ to: "/dashboard" });
			},

			mapRequestError: (err) => mapNotFoundError(err),
			mapCompleteError: (err) => mapNotFoundError(err),

			labels: {
				rightPanelTitle: "Wallet Sign-In",
				rightPanelDescription:
					"Sign in instantly with your EU Digital Identity Wallet. No passwords, just secure verification.",
				buttonText: "Continue with Wallet →",
				buttonLoadingText: "Creating request...",
			},

			slots: {
				leftPanel: <SigninLeftPanel />,
				walletFeatures: <SigninWalletFeatures />,
				footer: <AuthFooter />,
				successContent: undefined,
				errorContent: (message, errorType, onRetry) =>
					errorType === "not_found" ? (
						<NotFoundError message={message} onRetry={onRetry} />
					) : null, // Return null to let AuthFlow handle Vidos errors with VidosErrorDisplay
			},
		}),
		[apiClient, navigate],
	);

	return <AuthFlow config={config} />;
}

// ============================================================================
// Helpers
// ============================================================================

function mapNotFoundError(
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

		// Handle not found error
		if (typedErr.type === "not_found") {
			return {
				handled: true,
				state: {
					status: "error",
					message: "No account found with this identity.",
					errorType: "not_found",
				},
			};
		}
	}
	return { handled: false };
}

// ============================================================================
// Slot Components
// ============================================================================

function SigninLeftPanel() {
	return (
		<>
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
					Enter your email and password. This demo shows what traditional login
					looks like—fields are non-functional.
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
					<span className="font-semibold text-foreground/70">Demo Notice:</span>{" "}
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
		</>
	);
}

function SigninWalletFeatures() {
	return (
		<>
			<WalletFeatureItem
				title="Passwordless & Phishing-Proof"
				description="Cryptographic verification via OID4VP. No passwords to steal or phish."
			/>
			<WalletFeatureItem
				title="PID-based Identity"
				description="Government-verified attributes (name, birth date, nationality) per EU PID Rulebook."
			/>
			<WalletFeatureItem
				title="eIDAS 2.0 Compliant"
				description="Same flow banks must support for Strong Customer Authentication by Dec 2027."
			/>
		</>
	);
}

// ============================================================================
// Error Components
// ============================================================================

function NotFoundError({
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
						<div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
							<UserSearch className="w-12 h-12 text-muted-foreground" />
						</div>
					</div>
					<div className="space-y-2">
						<h3 className="text-2xl font-bold text-foreground">
							Account Not Found
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
							<Link to="/signup">Create Account</Link>
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
