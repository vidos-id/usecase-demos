import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import {
	ArrowRight,
	Bot,
	CheckCircle2,
	Copy,
	Fingerprint,
	Loader2,
	QrCode,
	RefreshCw,
	Shield,
	ShieldCheck,
	Smartphone,
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
import { apiClient } from "@/lib/api-client";
import type { AuthenticatedUser } from "../_auth";

export const Route = createFileRoute("/_app/_auth/agent")({
	component: AgentPage,
});

type DelegationScope = "book_tickets";

interface DelegationOfferResult {
	delegationId: string;
	credentialOffer: Record<string, unknown>;
	credentialOfferUri: string;
	credentialOfferDeepLink: string;
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
		"Allow the agent to obtain a holder-bound delegation credential and use it to book event tickets on your behalf.",
};

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

function IdentityGate() {
	return (
		<div className="space-y-8 animate-slide-up">
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
									Verify your identity with a PID credential before creating an
									OID4VCI delegation offer for your agent.
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

			<div className="max-w-2xl flex items-center gap-3 px-5 py-4 rounded-xl bg-primary/[0.03] border border-primary/10">
				<Shield className="h-5 w-5 text-primary/50 shrink-0" />
				<p className="text-sm text-muted-foreground leading-relaxed">
					<span className="font-medium text-foreground/80">Why?</span> The agent
					wallet receives the delegation credential directly from the issuer
					over OID4VCI after you approve it here.
				</p>
			</div>
		</div>
	);
}

function AgentOnboardingForm() {
	const [result, setResult] = useState<DelegationOfferResult | null>(null);
	const [copiedField, setCopiedField] = useState<"uri" | "deep-link" | null>(
		null,
	);

	const issueMutation = useMutation({
		mutationFn: async () => {
			const res = await apiClient.api.delegation.issue.$post({
				json: {
					scopes: [BOOKING_SCOPE.id],
				},
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					(body as { error?: string } | null)?.error ??
						"Failed to create delegation offer",
				);
			}
			return res.json() as Promise<DelegationOfferResult>;
		},
		onSuccess: (data) => {
			setResult(data);
			toast.success("Delegation offer created successfully");
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const copyValue = useCallback(
		async (label: "uri" | "deep-link", value: string) => {
			try {
				await navigator.clipboard.writeText(value);
				setCopiedField(label);
				toast.success(
					label === "uri" ? "Offer URL copied" : "Offer link copied",
				);
				setTimeout(() => setCopiedField(null), 2500);
			} catch {
				toast.error("Failed to copy to clipboard");
			}
		},
		[],
	);

	const handleReset = useCallback(() => {
		setResult(null);
		setCopiedField(null);
	}, []);

	if (result) {
		return (
			<OfferResult
				result={result}
				copiedField={copiedField}
				onCopy={copyValue}
				onReset={handleReset}
			/>
		);
	}

	return (
		<div className="space-y-8 animate-slide-up">
			<div className="space-y-2">
				<div className="flex items-center gap-2.5">
					<Bot className="h-5 w-5 text-primary/60" />
					<p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
						Agent Onboarding
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Create Agent Delegation Offer
				</h1>
				<p className="text-muted-foreground text-sm max-w-lg">
					Create an OID4VCI offer for your agent wallet. The agent receives the
					credential directly from the issuer after you share the offer link.
				</p>
			</div>

			<div className="max-w-2xl space-y-6">
				<Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03]">
					<CardHeader className="pb-4">
						<CardTitle className="text-base flex items-center gap-2">
							<div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
								<Shield className="h-3.5 w-3.5 text-primary" />
							</div>
							Delegated Capability
						</CardTitle>
						<CardDescription className="leading-relaxed">
							This offer issues a single booking-only delegation credential.
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

				<Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03]">
					<CardHeader className="pb-4">
						<CardTitle className="text-base flex items-center gap-2">
							<div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
								<Smartphone className="h-3.5 w-3.5 text-primary" />
							</div>
							What Changes
						</CardTitle>
						<CardDescription className="leading-relaxed">
							The user is no longer the credential courier.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-muted-foreground">
						<p>The app creates an OID4VCI offer.</p>
						<p>The agent receives it with `wallet-cli receive`.</p>
						<p>
							The issuer talks directly to the agent wallet and returns the
							credential there.
						</p>
					</CardContent>
				</Card>

				<Button
					onClick={() => issueMutation.mutate()}
					disabled={issueMutation.isPending}
					className="w-full h-12 text-sm font-semibold group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-md shadow-primary/15 disabled:opacity-50 disabled:shadow-none"
				>
					{issueMutation.isPending ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Creating Delegation Offer…
						</>
					) : (
						<>
							<ShieldCheck className="h-4 w-4" />
							Create Delegation Offer
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</>
					)}
				</Button>

				<div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-primary/[0.03] border border-primary/10">
					<Shield className="h-5 w-5 text-primary/50 shrink-0" />
					<p className="text-sm text-muted-foreground leading-relaxed">
						<span className="font-medium text-foreground/80">
							Replaces previous agent:
						</span>{" "}
						creating a new offer revokes any previously active delegation.
					</p>
				</div>
			</div>
		</div>
	);
}

function OfferResult({
	result,
	copiedField,
	onCopy,
	onReset,
}: {
	result: DelegationOfferResult;
	copiedField: "uri" | "deep-link" | null;
	onCopy: (label: "uri" | "deep-link", value: string) => void;
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

	return (
		<div className="space-y-8 animate-slide-up">
			<div className="space-y-2">
				<div className="flex items-center gap-2.5">
					<Bot className="h-5 w-5 text-primary/60" />
					<p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
						Agent Onboarding
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Delegation Offer Ready
				</h1>
				<p className="text-muted-foreground text-sm max-w-lg">
					Share one of the offer links below with your agent. The wallet should
					receive the credential using OID4VCI.
				</p>
			</div>

			<div className="max-w-2xl space-y-6">
				<div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-50/80 border border-emerald-200/50">
					<CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
					<p className="text-sm text-emerald-800 font-medium">
						Delegation offer created successfully
					</p>
				</div>

				<Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03]">
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
								<QrCode className="h-3.5 w-3.5 text-primary" />
							</div>
							Credential Offer URL
						</CardTitle>
						<CardDescription>
							Share this HTTPS URL with the agent if it can fetch the offer by
							reference.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-xl bg-gray-900 border border-gray-800 p-4 overflow-x-auto">
							<pre className="font-mono text-xs text-gray-100 leading-relaxed whitespace-pre-wrap break-all select-all">
								{result.credentialOfferUri}
							</pre>
						</div>
						<Button
							onClick={() => onCopy("uri", result.credentialOfferUri)}
							variant="outline"
							className="w-full gap-2"
						>
							<Copy className="h-4 w-4" />
							{copiedField === "uri" ? "Copied" : "Copy Offer URL"}
						</Button>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03]">
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
								<Smartphone className="h-3.5 w-3.5 text-primary" />
							</div>
							OpenID Credential Offer Link
						</CardTitle>
						<CardDescription>
							Share this when the wallet expects an `openid-credential-offer://`
							link directly.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-xl bg-gray-900 border border-gray-800 p-4 overflow-x-auto">
							<pre className="font-mono text-xs text-gray-100 leading-relaxed whitespace-pre-wrap break-all select-all">
								{result.credentialOfferDeepLink}
							</pre>
						</div>
						<Button
							onClick={() =>
								onCopy("deep-link", result.credentialOfferDeepLink)
							}
							variant="outline"
							className="w-full gap-2"
						>
							<Copy className="h-4 w-4" />
							{copiedField === "deep-link" ? "Copied" : "Copy Offer Link"}
						</Button>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03]">
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
								<Shield className="h-3.5 w-3.5 text-primary" />
							</div>
							Offer Summary
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="divide-y divide-border/50">
							<div className="flex items-center justify-between py-3 first:pt-0">
								<span className="text-sm text-muted-foreground">
									Delegation ID
								</span>
								<span className="text-sm font-mono">{result.delegationId}</span>
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
											{scope}
										</Badge>
									))}
								</div>
							</div>
							<div className="flex items-center justify-between py-3 last:pb-0">
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

				<div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-6 space-y-3">
					<div className="flex items-center gap-2">
						<Bot className="h-5 w-5 text-primary/70" />
						<h3 className="text-sm font-semibold text-foreground/90">
							Agent Handoff
						</h3>
					</div>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Tell the agent to run `wallet-cli receive --wallet-dir ./wallet
						--offer "&lt;offer&gt;"` using one of the links above. The issuer
						will deliver the credential directly to the wallet.
					</p>
				</div>

				<Button
					onClick={onReset}
					variant="outline"
					className="w-full h-12 text-sm font-semibold group border-primary/20 text-primary hover:bg-primary/5"
				>
					<RefreshCw className="h-4 w-4 transition-transform group-hover:-rotate-45" />
					Create New Offer
				</Button>
			</div>
		</div>
	);
}
