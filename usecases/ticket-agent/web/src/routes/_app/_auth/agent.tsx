import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowRight,
	Bot,
	CheckCircle2,
	ClipboardCheck,
	Copy,
	Fingerprint,
	Key,
	Loader2,
	RefreshCw,
	Shield,
	ShieldCheck,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import type { AuthenticatedUser } from "../_auth";

export const Route = createFileRoute("/_app/_auth/agent")({
	component: AgentPage,
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DelegationScope = "book_tickets";

interface DelegationResult {
	credential: string;
	delegatorName: string;
	scopes: string[];
	validUntil: string;
}

const BOOKING_SCOPE: {
	id: DelegationScope;
	label: string;
	description: string;
} = {
	id: "book_tickets",
	label: "Book Tickets",
	description:
		"Allow the agent to start ticket bookings on your behalf and complete them via Vidos credential presentation.",
};

const JWK_PLACEHOLDER = `{
  "kty": "EC",
  "crv": "P-256",
  "x": "f83OJ3D2xF1Bg8...",
  "y": "x_FEzRu9m36HLN..."
}`;

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

function AgentPage() {
	const { user } = useRouteContext({ from: "/_app/_auth" });

	const { data: freshUser } = useQuery({
		queryKey: ["user", "me"],
		queryFn: async () => {
			const res = await apiClient.api.me.$get({});
			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
	});

	const currentUser = (freshUser ?? user) as AuthenticatedUser;

	if (!currentUser.identityVerified) {
		return <IdentityGate />;
	}

	return <AgentOnboardingForm />;
}

/* ------------------------------------------------------------------ */
/*  Identity Gate                                                      */
/* ------------------------------------------------------------------ */

function IdentityGate() {
	return (
		<div className="space-y-8 animate-slide-up">
			{/* Page header */}
			<div className="space-y-2">
				<div className="flex items-center gap-2.5">
					<Bot className="h-5 w-5 text-primary/60" />
					<p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
						Agent Onboarding
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Onboard Your AI Agent
				</h1>
				<p className="text-muted-foreground text-sm max-w-lg">
					Delegate permissions to your AI agent so it can act on your behalf.
				</p>
			</div>

			{/* Gate card */}
			<div className="max-w-2xl">
				<Card className="border-amber-200/60 bg-amber-50/30 shadow-lg shadow-amber-900/[0.03]">
					<CardContent className="p-8">
						<div className="flex flex-col items-center text-center space-y-5">
							<div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-200/50 shadow-sm">
								<Fingerprint className="h-8 w-8 text-amber-600" />
							</div>

							<div className="space-y-2">
								<h2 className="text-lg font-semibold tracking-tight">
									Identity Verification Required
								</h2>
								<p className="text-sm text-muted-foreground leading-relaxed max-w-md">
									Before you can delegate permissions to an AI agent, you need
									to verify your identity with a PID credential. This ensures
									your agent acts under a verified identity.
								</p>
							</div>

							<Button
								asChild
								className="h-11 px-6 text-sm font-semibold group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-md shadow-primary/15"
							>
								<Link to="/identity">
									<Fingerprint className="h-4 w-4" />
									Verify Identity
									<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Info strip */}
			<div className="max-w-2xl flex items-center gap-3 px-5 py-4 rounded-xl bg-primary/[0.03] border border-primary/10">
				<Shield className="h-5 w-5 text-primary/50 shrink-0" />
				<p className="text-sm text-muted-foreground leading-relaxed">
					<span className="font-medium text-foreground/80">Why?</span>{" "}
					Delegation credentials bind your verified identity to your
					agent&apos;s public key, creating a trust chain that event organizers
					can verify.
				</p>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Onboarding Form                                                    */
/* ------------------------------------------------------------------ */

function AgentOnboardingForm() {
	const [jwkInput, setJwkInput] = useState("");
	const [jwkValid, setJwkValid] = useState<boolean | null>(null);
	const [jwkError, setJwkError] = useState<string | null>(null);
	const [parsedJwk, setParsedJwk] = useState<Record<string, unknown> | null>(
		null,
	);
	const [result, setResult] = useState<DelegationResult | null>(null);
	const [copied, setCopied] = useState(false);

	/* JWK validation */
	const validateJwk = useCallback((value: string) => {
		setJwkInput(value);

		if (!value.trim()) {
			setJwkValid(null);
			setJwkError(null);
			setParsedJwk(null);
			return;
		}

		try {
			const parsed = JSON.parse(value);
			if (
				typeof parsed !== "object" ||
				parsed === null ||
				Array.isArray(parsed)
			) {
				setJwkValid(false);
				setJwkError("JWK must be a JSON object");
				setParsedJwk(null);
				return;
			}
			if (!parsed.kty) {
				setJwkValid(false);
				setJwkError('Missing required "kty" field');
				setParsedJwk(null);
				return;
			}
			setJwkValid(true);
			setJwkError(null);
			setParsedJwk(parsed);
		} catch {
			setJwkValid(false);
			setJwkError("Invalid JSON syntax");
			setParsedJwk(null);
		}
	}, []);

	/* Issue mutation */
	const issueMutation = useMutation({
		mutationFn: async () => {
			if (!parsedJwk) throw new Error("No valid JWK");
			const res = await apiClient.api.delegation.issue.$post({
				json: {
					agentPublicKey: parsedJwk,
					scopes: [BOOKING_SCOPE.id],
				},
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					(body as { error?: string } | null)?.error ??
						"Failed to issue credential",
				);
			}
			return res.json() as Promise<DelegationResult>;
		},
		onSuccess: (data) => {
			setResult(data);
			toast.success("Delegation credential issued successfully!");
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	/* Copy to clipboard */
	const handleCopy = useCallback(async () => {
		if (!result?.credential) return;
		try {
			await navigator.clipboard.writeText(result.credential);
			setCopied(true);
			toast.success("Credential copied to clipboard");
			setTimeout(() => setCopied(false), 2500);
		} catch {
			toast.error("Failed to copy — try selecting the text manually");
		}
	}, [result]);

	/* Reset form */
	const handleReset = useCallback(() => {
		setJwkInput("");
		setJwkValid(null);
		setJwkError(null);
		setParsedJwk(null);
		setResult(null);
		setCopied(false);
	}, []);

	const canSubmit = jwkValid === true;

	/* ---- Result view ---- */
	if (result) {
		return (
			<CredentialResult
				result={result}
				copied={copied}
				onCopy={handleCopy}
				onReset={handleReset}
			/>
		);
	}

	/* ---- Form view ---- */
	return (
		<div className="space-y-8 animate-slide-up">
			{/* Page header */}
			<div className="space-y-2">
				<div className="flex items-center gap-2.5">
					<Bot className="h-5 w-5 text-primary/60" />
					<p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
						Agent Onboarding
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Onboard Your AI Agent
				</h1>
				<p className="text-muted-foreground text-sm max-w-lg">
					Provide your agent&apos;s public key to issue a booking-only
					delegation credential.
				</p>
			</div>

			<div className="max-w-2xl space-y-6">
				{/* Step 1: JWK Input */}
				<Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03]">
					<CardHeader className="pb-4">
						<CardTitle className="text-base flex items-center gap-2">
							<div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
								<Key className="h-3.5 w-3.5 text-primary" />
							</div>
							Agent Public Key
						</CardTitle>
						<CardDescription className="leading-relaxed">
							Your AI agent provides this key when initialized via{" "}
							<code className="font-mono text-xs bg-muted/80 px-1.5 py-0.5 rounded-md border border-border/40">
								wallet-cli init
							</code>
							. Paste the public key JSON below.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="relative">
							<Textarea
								value={jwkInput}
								onChange={(e) => validateJwk(e.target.value)}
								placeholder={JWK_PLACEHOLDER}
								className="font-mono text-sm min-h-[160px] resize-y bg-background/60 border-border/60 focus-visible:border-primary/40 transition-colors leading-relaxed"
								spellCheck={false}
							/>
							{/* Validation indicator */}
							{jwkValid !== null && (
								<div className="absolute top-3 right-3">
									{jwkValid ? (
										<div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200/50">
											<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
											<span className="text-xs font-medium text-emerald-700">
												Valid JWK
											</span>
										</div>
									) : (
										<div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/5 border border-destructive/15">
											<AlertCircle className="h-3.5 w-3.5 text-destructive" />
											<span className="text-xs font-medium text-destructive">
												{jwkError}
											</span>
										</div>
									)}
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Step 2: Delegated capability */}
				<Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03]">
					<CardHeader className="pb-4">
						<CardTitle className="text-base flex items-center gap-2">
							<div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
								<Shield className="h-3.5 w-3.5 text-primary" />
							</div>
							Delegated Capability
						</CardTitle>
						<CardDescription className="leading-relaxed">
							This credential is intentionally limited to one capability.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-start gap-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
							<div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-[4px] border border-primary/30 bg-primary text-primary-foreground">
								<CheckCircle2 className="h-3 w-3" />
							</div>
							<div className="space-y-1 flex-1">
								<Label className="text-sm font-semibold">
									{BOOKING_SCOPE.label}
								</Label>
								<p className="text-xs text-muted-foreground leading-relaxed">
									{BOOKING_SCOPE.description}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Submit */}
				<Button
					onClick={() => issueMutation.mutate()}
					disabled={!canSubmit || issueMutation.isPending}
					className="w-full h-12 text-sm font-semibold group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-md shadow-primary/15 disabled:opacity-50 disabled:shadow-none"
				>
					{issueMutation.isPending ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Issuing Credential…
						</>
					) : (
						<>
							<ShieldCheck className="h-4 w-4" />
							Issue Delegation Credential
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</>
					)}
				</Button>

				{/* Info strip */}
				<div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-primary/[0.03] border border-primary/10">
					<Shield className="h-5 w-5 text-primary/50 shrink-0" />
					<p className="text-sm text-muted-foreground leading-relaxed">
						<span className="font-medium text-foreground/80">
							Replaces previous agent:
						</span>{" "}
						Issuing a new credential will automatically revoke any previously
						active agent delegation.
					</p>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Credential Result                                                  */
/* ------------------------------------------------------------------ */

function CredentialResult({
	result,
	copied,
	onCopy,
	onReset,
}: {
	result: DelegationResult;
	copied: boolean;
	onCopy: () => void;
	onReset: () => void;
}) {
	const formattedDate = new Date(result.validUntil).toLocaleDateString(
		"en-US",
		{
			year: "numeric",
			month: "long",
			day: "numeric",
		},
	);

	const scopeLabels: Record<string, string> = {
		book_tickets: "Book Tickets",
	};

	return (
		<div className="space-y-8 animate-slide-up">
			{/* Page header */}
			<div className="space-y-2">
				<div className="flex items-center gap-2.5">
					<Bot className="h-5 w-5 text-primary/60" />
					<p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
						Agent Onboarding
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Credential Issued
				</h1>
				<p className="text-muted-foreground text-sm max-w-lg">
					Your delegation credential has been created. Hand it off to your
					agent.
				</p>
			</div>

			<div className="max-w-2xl space-y-6">
				{/* Success banner */}
				<div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-50/80 border border-emerald-200/50">
					<CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
					<p className="text-sm text-emerald-800 font-medium">
						Delegation credential issued successfully
					</p>
				</div>

				{/* Credential display */}
				<Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03] overflow-hidden">
					<CardHeader className="pb-3">
						<CardTitle className="text-base flex items-center gap-2">
							<div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
								<Key className="h-3.5 w-3.5 text-primary" />
							</div>
							Delegation Credential
							<Badge
								variant="outline"
								className="ml-auto border-primary/20 bg-primary/5 text-primary text-[10px] font-mono uppercase tracking-wider"
							>
								dc+sd-jwt
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="relative group/code">
							<div className="rounded-xl bg-gray-900 border border-gray-800 p-4 overflow-x-auto">
								<pre className="font-mono text-xs text-gray-100 leading-relaxed whitespace-pre-wrap break-all select-all">
									{result.credential}
								</pre>
							</div>
							<Button
								onClick={onCopy}
								variant="outline"
								size="sm"
								className={`absolute top-3 right-3 gap-1.5 text-xs transition-all duration-200 ${
									copied
										? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
										: "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-gray-100 opacity-0 group-hover/code:opacity-100"
								}`}
							>
								{copied ? (
									<>
										<ClipboardCheck className="h-3.5 w-3.5" />
										Copied
									</>
								) : (
									<>
										<Copy className="h-3.5 w-3.5" />
										Copy
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Summary card */}
				<Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03]">
					<CardHeader className="pb-3">
						<CardTitle className="text-base flex items-center gap-2">
							<div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
								<Shield className="h-3.5 w-3.5 text-primary" />
							</div>
							Credential Summary
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="divide-y divide-border/50">
							<div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
								<span className="text-sm text-muted-foreground">
									Delegator Name
								</span>
								<span className="text-sm font-semibold">
									{result.delegatorName}
								</span>
							</div>
							<div className="flex items-start justify-between py-3">
								<span className="text-sm text-muted-foreground">Scopes</span>
								<div className="flex flex-wrap gap-1.5 justify-end">
									{result.scopes.map((scope) => (
										<Badge
											key={scope}
											variant="outline"
											className="border-primary/15 bg-primary/[0.04] text-foreground/80 text-xs"
										>
											{scopeLabels[scope] ?? scope}
										</Badge>
									))}
								</div>
							</div>
							<div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
								<span className="text-sm text-muted-foreground">
									Valid Until
								</span>
								<span className="text-sm font-mono font-medium">
									{formattedDate}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Handoff instructions */}
				<div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-6 space-y-3">
					<div className="flex items-center gap-2">
						<Bot className="h-5 w-5 text-primary/70" />
						<h3 className="text-sm font-semibold text-foreground/90">
							Agent Handoff
						</h3>
					</div>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Copy the credential above and paste it into your agent&apos;s chat
						session. The agent will import it using{" "}
						<code className="font-mono text-xs bg-primary/[0.06] px-1.5 py-0.5 rounded-md border border-primary/10">
							wallet-cli import
						</code>
						. Agent bookings should then start unauthenticated, receive a Vidos
						authorization URL, and complete by presenting this credential.
					</p>
				</div>

				{/* Reset / New Agent */}
				<Button
					onClick={onReset}
					variant="outline"
					className="w-full h-12 text-sm font-semibold group border-primary/20 text-primary hover:bg-primary/5"
				>
					<RefreshCw className="h-4 w-4 transition-transform group-hover:-rotate-45" />
					Onboard New Agent
				</Button>
			</div>
		</div>
	);
}
