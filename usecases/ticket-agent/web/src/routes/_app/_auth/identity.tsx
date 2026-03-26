import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Bot,
	CheckCircle2,
	ClipboardCopy,
	Fingerprint,
	Loader2,
	QrCode,
	RefreshCw,
	Shield,
	XCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app/_auth/identity")({
	component: IdentityPage,
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type VerificationState =
	| { step: "idle" }
	| { step: "loading" }
	| {
			step: "pending";
			authorizationId: string;
			authorizeUrl: string;
	  }
	| {
			step: "authorized";
			givenName: string;
			familyName: string;
	  }
	| { step: "failed"; reason: string };

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function IdentityPage() {
	const { user } = Route.useRouteContext();

	// Fetch fresh user data to handle post-verification staleness
	const userQuery = useQuery({
		queryKey: ["me"],
		queryFn: async () => {
			const res = await apiClient.api.me.$get({});
			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
		initialData: user,
		staleTime: 5_000,
	});

	const currentUser = userQuery.data;

	if (currentUser.identityVerified) {
		return <VerifiedState user={currentUser} />;
	}

	return <VerificationFlow />;
}

/* ------------------------------------------------------------------ */
/*  Already-verified state (Task 11.2)                                 */
/* ------------------------------------------------------------------ */

function VerifiedState({
	user,
}: {
	user: {
		givenName: string | null;
		familyName: string | null;
		hasActiveAgent: boolean;
	};
}) {
	return (
		<div className="max-w-xl mx-auto space-y-6 animate-slide-up">
			{/* Header */}
			<div className="space-y-2">
				<div className="flex items-center gap-2.5">
					<Shield className="h-5 w-5 text-primary/60" />
					<p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
						Identity
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Identity Verified
				</h1>
				<p className="text-muted-foreground text-sm max-w-lg">
					Your identity has been successfully verified using your EUDI Wallet.
				</p>
			</div>

			{/* Success card */}
			<Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white shadow-lg shadow-emerald-900/[0.04]">
				<CardContent className="p-6 space-y-5">
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-200/50 shrink-0">
							<CheckCircle2 className="h-6 w-6 text-emerald-600" />
						</div>
						<div className="space-y-1">
							<h2 className="font-semibold tracking-tight text-emerald-900">
								Verification Complete
							</h2>
							<p className="text-sm text-emerald-700/70 leading-relaxed">
								Your PID credential was successfully presented and validated.
							</p>
						</div>
					</div>

					{/* Identity claims */}
					<div className="rounded-lg border border-emerald-200/40 bg-white/80 divide-y divide-emerald-100/60">
						<div className="flex items-center justify-between px-4 py-3">
							<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
								Given Name
							</span>
							<span className="text-sm font-semibold text-foreground">
								{user.givenName ?? "—"}
							</span>
						</div>
						<div className="flex items-center justify-between px-4 py-3">
							<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
								Family Name
							</span>
							<span className="text-sm font-semibold text-foreground">
								{user.familyName ?? "—"}
							</span>
						</div>
					</div>

					{/* One-time note */}
					<div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-emerald-50/80 border border-emerald-200/30">
						<Shield className="h-4 w-4 text-emerald-600/60 shrink-0 mt-0.5" />
						<p className="text-xs text-emerald-700/70 leading-relaxed">
							Identity verification is a one-time step. Your verified identity
							is now linked to your account and will be used for all future
							agent delegations.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Next step CTA */}
			{!user.hasActiveAgent && (
				<Card className="border-border/50 bg-white/70 backdrop-blur-sm shadow-sm">
					<CardContent className="p-6">
						<div className="flex items-center gap-4">
							<div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center border border-indigo-200/40 shrink-0">
								<Bot className="h-5 w-5 text-indigo-600" />
							</div>
							<div className="flex-1 space-y-1">
								<h3 className="font-semibold tracking-tight text-sm">
									Next: Onboard Your Agent
								</h3>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Now that your identity is verified, you can delegate
									permissions to your AI agent.
								</p>
							</div>
							<Button
								asChild
								size="sm"
								className="shrink-0 bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-md shadow-primary/15 group"
							>
								<Link to="/agent">
									Continue
									<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Verification flow (Task 11.1)                                      */
/* ------------------------------------------------------------------ */

function VerificationFlow() {
	const queryClient = useQueryClient();
	const [state, setState] = useState<VerificationState>({ step: "idle" });

	const reset = useCallback(() => {
		setState({ step: "idle" });
	}, []);

	/* -- Start verification ---------------------------------------- */

	const startMutation = useMutation({
		mutationFn: async () => {
			const res = await apiClient.api.identity.verify.$post({});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					(body as { error?: string } | null)?.error ??
						"Failed to start verification",
				);
			}

			return res.json() as Promise<{
				authorizationId: string;
				authorizeUrl: string;
			}>;
		},
		onMutate: () => {
			setState({ step: "loading" });
		},
		onSuccess: (data) => {
			setState({
				step: "pending",
				authorizationId: data.authorizationId,
				authorizeUrl: data.authorizeUrl,
			});
		},
		onError: (err) => {
			setState({ step: "failed", reason: err.message });
		},
	});

	/* -- Poll status ----------------------------------------------- */

	const authorizationId =
		state.step === "pending" ? state.authorizationId : null;

	const statusQuery = useQuery({
		queryKey: ["identity-status", authorizationId],
		queryFn: async () => {
			if (!authorizationId) throw new Error("No authorization ID");
			const res = await apiClient.api.identity.verify[":id"].status.$get({
				param: { id: authorizationId },
			});
			if (!res.ok) throw new Error("Failed to poll status");
			return res.json() as Promise<{
				status: "pending" | "authorized" | "rejected" | "error" | "expired";
				user?: {
					identityVerified: boolean;
					givenName: string | null;
					familyName: string | null;
				};
			}>;
		},
		enabled: !!authorizationId,
		refetchInterval: 2_000,
	});

	// React to status changes
	useEffect(() => {
		if (!statusQuery.data) return;
		const { status, user } = statusQuery.data;

		if (status === "authorized" && user?.givenName && user.familyName) {
			setState({
				step: "authorized",
				givenName: user.givenName,
				familyName: user.familyName,
			});
			// Invalidate the "me" query so the layout and other pages pick up the change
			queryClient.invalidateQueries({ queryKey: ["me"] });
		} else if (
			status === "rejected" ||
			status === "error" ||
			status === "expired"
		) {
			const reasons: Record<string, string> = {
				rejected: "Verification was rejected by the wallet.",
				error: "An error occurred during verification.",
				expired: "The verification request has expired.",
			};
			setState({ step: "failed", reason: reasons[status] ?? status });
		}
	}, [statusQuery.data, queryClient]);

	return (
		<div className="max-w-xl mx-auto space-y-6 animate-slide-up">
			{/* Header */}
			<div className="space-y-2">
				<div className="flex items-center gap-2.5">
					<Shield className="h-5 w-5 text-primary/60" />
					<p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
						Identity
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Verify Your Identity
				</h1>
				<p className="text-muted-foreground text-sm max-w-lg">
					Present your PID credential from the EUDI Wallet to verify your
					identity on the platform.
				</p>
			</div>

			{/* State-dependent content */}
			{state.step === "idle" && (
				<IdleState onStart={() => startMutation.mutate()} />
			)}
			{state.step === "loading" && <LoadingState />}
			{state.step === "pending" && (
				<PendingState
					authorizeUrl={state.authorizeUrl}
					authorizationId={state.authorizationId}
				/>
			)}
			{state.step === "authorized" && (
				<AuthorizedState
					givenName={state.givenName}
					familyName={state.familyName}
				/>
			)}
			{state.step === "failed" && (
				<FailedState reason={state.reason} onRetry={reset} />
			)}

			{/* Info strip */}
			<div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-primary/[0.03] border border-primary/10">
				<Fingerprint className="h-5 w-5 text-primary/50 shrink-0" />
				<p className="text-sm text-muted-foreground leading-relaxed">
					<span className="font-medium text-foreground/80">Why verify?</span>{" "}
					Identity verification ensures your AI agent acts on behalf of a real,
					verified person. This is required before agent onboarding.
				</p>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Idle — not yet started                                             */
/* ------------------------------------------------------------------ */

function IdleState({ onStart }: { onStart: () => void }) {
	return (
		<Card className="border-border/50 bg-white/70 backdrop-blur-sm shadow-lg shadow-violet-900/[0.04] animate-slide-up">
			<CardContent className="p-6 space-y-5">
				<div className="flex items-start gap-4">
					<div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center border border-violet-200/40">
						<QrCode className="h-6 w-6 text-violet-600" />
					</div>
					<div className="space-y-1">
						<h2 className="font-semibold tracking-tight">
							Present Your PID Credential
						</h2>
						<p className="text-sm text-muted-foreground leading-relaxed">
							Click the button below to generate a QR code. Then scan it with
							your EUDI Wallet to present your Person Identification Data (PID)
							credential.
						</p>
					</div>
				</div>

				{/* Steps preview */}
				<div className="rounded-lg border border-border/40 bg-secondary/30 divide-y divide-border/30">
					<StepRow number={1} text="Generate a verification QR code" />
					<StepRow number={2} text="Scan with your EUDI Wallet app" />
					<StepRow number={3} text="Approve the credential presentation" />
					<StepRow
						number={4}
						text="Your identity is verified on the platform"
					/>
				</div>

				<Button
					onClick={onStart}
					className="w-full h-11 text-sm font-semibold group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-md shadow-primary/15"
				>
					<Fingerprint className="h-4 w-4" />
					Verify Identity
					<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</Button>
			</CardContent>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Loading — creating authorization request                           */
/* ------------------------------------------------------------------ */

function LoadingState() {
	return (
		<Card className="border-border/50 bg-white/70 backdrop-blur-sm shadow-lg shadow-violet-900/[0.04] animate-slide-up">
			<CardContent className="p-10 flex flex-col items-center gap-4">
				<div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center border border-violet-200/40">
					<Loader2 className="h-6 w-6 text-primary animate-spin" />
				</div>
				<div className="text-center space-y-1">
					<h2 className="font-semibold tracking-tight">
						Preparing Verification
					</h2>
					<p className="text-sm text-muted-foreground">
						Creating authorization request…
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Pending — QR code displayed, polling                               */
/* ------------------------------------------------------------------ */

function PendingState({
	authorizeUrl,
	authorizationId,
}: {
	authorizeUrl: string;
	authorizationId: string;
}) {
	const [copied, setCopied] = useState(false);

	const copyUrl = useCallback(() => {
		navigator.clipboard.writeText(authorizeUrl).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2_000);
		});
	}, [authorizeUrl]);

	return (
		<div className="space-y-4 animate-slide-up">
			{/* QR Card */}
			<Card className="border-border/50 bg-white shadow-lg shadow-violet-900/[0.04]">
				<CardContent className="p-6 space-y-5">
					{/* Status badge */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<QrCode className="h-4 w-4 text-primary/60" />
							<span className="text-sm font-semibold tracking-tight">
								Scan QR Code
							</span>
						</div>
						<Badge
							variant="outline"
							className="border-amber-200 bg-amber-50 text-amber-700 gap-1.5"
						>
							<Loader2 className="h-3 w-3 animate-spin" />
							Waiting for wallet
						</Badge>
					</div>

					{/* QR code */}
					<div className="flex justify-center">
						<div className="p-5 rounded-xl border border-border/60 bg-white shadow-sm">
							<QRCodeSVG
								value={authorizeUrl}
								size={256}
								level="M"
								className="h-auto w-full max-w-[256px]"
							/>
						</div>
					</div>

					{/* Instructions */}
					<p className="text-sm text-muted-foreground text-center leading-relaxed">
						Scan with your{" "}
						<span className="font-medium text-foreground/80">EUDI Wallet</span>{" "}
						to verify your identity.
					</p>

					{/* Authorize URL (copyable, for wallet-cli) */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
								Authorization URL
							</span>
							<Button
								variant="ghost"
								size="xs"
								onClick={copyUrl}
								className="text-muted-foreground hover:text-foreground gap-1"
							>
								<ClipboardCopy className="h-3 w-3" />
								{copied ? "Copied!" : "Copy"}
							</Button>
						</div>
						<div className="p-3 rounded-lg bg-secondary/40 border border-border/40 overflow-x-auto">
							<code className="text-xs font-mono text-foreground/70 break-all leading-relaxed">
								{authorizeUrl}
							</code>
						</div>
					</div>

					{/* Authorization ID */}
					<div className="flex items-center justify-between pt-2 border-t border-border/30">
						<span className="text-xs text-muted-foreground/60">
							Authorization ID
						</span>
						<code className="text-xs font-mono text-muted-foreground/60">
							{authorizationId}
						</code>
					</div>
				</CardContent>
			</Card>

			{/* Polling indicator */}
			<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
				<Loader2 className="h-3 w-3 animate-spin" />
				<span>Polling for wallet response every 2 seconds…</span>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Authorized — success                                               */
/* ------------------------------------------------------------------ */

function AuthorizedState({
	givenName,
	familyName,
}: {
	givenName: string;
	familyName: string;
}) {
	return (
		<div className="space-y-4 animate-slide-up">
			<Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white shadow-lg shadow-emerald-900/[0.04]">
				<CardContent className="p-6 space-y-5">
					<div className="flex flex-col items-center gap-4 py-2">
						<div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-200/50">
							<CheckCircle2 className="h-8 w-8 text-emerald-600" />
						</div>
						<div className="text-center space-y-1">
							<h2 className="text-lg font-bold tracking-tight text-emerald-900">
								Identity Verified
							</h2>
							<p className="text-sm text-emerald-700/70">
								Your PID credential was successfully validated.
							</p>
						</div>
					</div>

					{/* Verified claims */}
					<div className="rounded-lg border border-emerald-200/40 bg-white/80 divide-y divide-emerald-100/60">
						<div className="flex items-center justify-between px-4 py-3">
							<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
								Given Name
							</span>
							<span className="text-sm font-semibold text-foreground">
								{givenName}
							</span>
						</div>
						<div className="flex items-center justify-between px-4 py-3">
							<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
								Family Name
							</span>
							<span className="text-sm font-semibold text-foreground">
								{familyName}
							</span>
						</div>
					</div>

					<Button
						asChild
						className="w-full h-11 text-sm font-semibold group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-md shadow-primary/15"
					>
						<Link to="/agent">
							<Bot className="h-4 w-4" />
							Continue to Agent Onboarding
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Failed — error / rejected / expired                                */
/* ------------------------------------------------------------------ */

function FailedState({
	reason,
	onRetry,
}: {
	reason: string;
	onRetry: () => void;
}) {
	return (
		<Card className="border-destructive/20 bg-gradient-to-br from-red-50/40 to-white shadow-lg shadow-red-900/[0.03] animate-slide-up">
			<CardContent className="p-6 space-y-5">
				<div className="flex flex-col items-center gap-4 py-2">
					<div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center border border-red-200/50">
						<XCircle className="h-8 w-8 text-red-500" />
					</div>
					<div className="text-center space-y-1">
						<h2 className="text-lg font-bold tracking-tight text-red-900">
							Verification Failed
						</h2>
						<p className="text-sm text-red-700/70 max-w-sm">{reason}</p>
					</div>
				</div>

				<Button
					onClick={onRetry}
					variant="outline"
					className="w-full h-11 text-sm font-semibold border-primary/20 text-primary hover:bg-primary/5 group"
				>
					<RefreshCw className="h-4 w-4" />
					Try Again
					<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</Button>
			</CardContent>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Helper: step row for the idle state                                */
/* ------------------------------------------------------------------ */

function StepRow({ number, text }: { number: number; text: string }) {
	return (
		<div className="flex items-center gap-3 px-4 py-3">
			<div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
				<span className="text-xs font-bold text-primary">{number}</span>
			</div>
			<span className="text-sm text-foreground/80">{text}</span>
		</div>
	);
}
