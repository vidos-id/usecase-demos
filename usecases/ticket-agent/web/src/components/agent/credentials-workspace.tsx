import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Ban,
	Bot,
	Check,
	Clock,
	Copy,
	KeyRound,
	Loader2,
	PauseCircle,
	PlayCircle,
	Shield,
	ShieldCheck,
	Smartphone,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useClipboard } from "vidos-web/clipboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import type { AuthenticatedUser } from "@/routes/_app/_auth";

type DelegationScope = "book_tickets";
type ManagedCredential = AuthenticatedUser["delegatedCredentials"][number];

interface DelegationOfferResult {
	delegationId: string;
	agentName: string;
	credentialOffer: Record<string, unknown>;
	credentialOfferUri: string;
	credentialOfferDeepLink: string;
	scopes: string[];
	offerExpiresAt: string;
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

export function formatDateTime(value: string | null) {
	if (!value) {
		return null;
	}

	return new Date(value).toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function formatHolderKey(holderPublicKey: Record<string, unknown> | null) {
	if (!holderPublicKey) {
		return null;
	}

	return JSON.stringify(holderPublicKey, null, 2);
}

/** Short delegation ID for display: first 8 chars */
function shortId(id: string) {
	return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export function CredentialsWorkspace({
	user,
	mode,
}: {
	user: AuthenticatedUser;
	mode: "list" | "onboard";
}) {
	const queryClient = useQueryClient();
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [agentName, setAgentName] = useState("");
	const userQuery = useQuery({
		queryKey: ["me"],
		queryFn: async () => {
			const res = await apiClient.api.me.$get({});
			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
		initialData: user,
		staleTime: 5_000,
		refetchInterval: (query) => {
			const currentUser = query.state.data as AuthenticatedUser | undefined;
			const hasOpenOffer = currentUser?.delegatedCredentials?.some(
				(credential) =>
					credential.state === "offer_ready" ||
					credential.state === "offer_redeeming",
			);

			return hasOpenOffer ? 2_000 : false;
		},
	});

	const currentUser = userQuery.data as AuthenticatedUser;
	const delegatedCredentials = currentUser.delegatedCredentials ?? [];
	const refreshUser = () => queryClient.invalidateQueries({ queryKey: ["me"] });

	const issueMutation = useMutation({
		mutationFn: async () => {
			const res = await apiClient.api.delegation.issue.$post({
				json: {
					agentName: agentName.trim(),
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
		onSuccess: () => {
			setCopiedField(null);
			setAgentName("");
			refreshUser();
			toast.success("Delegation offer created successfully");
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const suspendMutation = useMutation({
		mutationFn: async (delegationId: string) => {
			const res = await apiClient.api.delegation.suspend.$post({
				json: { delegationId },
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					(body as { error?: string } | null)?.error ??
						"Failed to suspend credential",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			refreshUser();
			toast.success("Credential suspended");
		},
		onError: (err) => toast.error(err.message),
	});

	const reactivateMutation = useMutation({
		mutationFn: async (delegationId: string) => {
			const res = await apiClient.api.delegation.reactivate.$post({
				json: { delegationId },
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					(body as { error?: string } | null)?.error ??
						"Failed to reactivate credential",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			refreshUser();
			toast.success("Credential reactivated");
		},
		onError: (err) => toast.error(err.message),
	});

	const revokeMutation = useMutation({
		mutationFn: async (delegationId: string) => {
			const res = await apiClient.api.delegation.revoke.$post({
				json: { delegationId },
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					(body as { error?: string } | null)?.error ??
						"Failed to revoke credential",
				);
			}
			return res.json();
		},
		onSuccess: () => {
			refreshUser();
			toast.success("Credential revoked");
		},
		onError: (err) => toast.error(err.message),
	});
	const { copy } = useClipboard({
		onSuccess: () => toast.success("Copied to clipboard"),
		onError: () => toast.error("Failed to copy to clipboard"),
	});

	const copyValue = (key: string, value: string) => copy(value, key);

	const latestPendingCredential = useMemo(
		() =>
			delegatedCredentials.find((credential) => credential.status === null) ??
			null,
		[delegatedCredentials],
	);

	const completedCredentials = useMemo(() => {
		const statusOrder = {
			active: 0,
			suspended: 1,
			revoked: 2,
		} as const;

		return delegatedCredentials
			.filter(
				(
					credential,
				): credential is ManagedCredential & {
					status: "active" | "suspended" | "revoked";
				} => credential.status !== null,
			)
			.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
	}, [delegatedCredentials]);

	if (mode === "onboard") {
		return (
			<div className="space-y-5 animate-slide-up">
				<OnboardSection
					isCreating={issueMutation.isPending}
					onCreateOffer={() => issueMutation.mutate()}
					agentName={agentName}
					onAgentNameChange={setAgentName}
					hasPendingOffer={latestPendingCredential !== null}
					latestPendingCredential={latestPendingCredential}
					copiedField={copiedField}
					onCopy={copyValue}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-5 animate-slide-up">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h2 className="text-base font-semibold tracking-tight">
						Issued Credentials
					</h2>
					<p className="text-sm text-muted-foreground">
						Active credentials are listed first, followed by suspended and
						revoked ones.
					</p>
				</div>
				<Button asChild size="sm" className="shrink-0 gap-1.5">
					<Link to="/agent/onboard">
						<ShieldCheck className="h-3.5 w-3.5" />
						Onboard Agent
					</Link>
				</Button>
			</div>

			{completedCredentials.length === 0 ? (
				<EmptyCredentialsState />
			) : (
				<div className="space-y-3">
					{completedCredentials.map((credential) => (
						<CredentialCard
							key={credential.delegationId}
							credential={credential}
							copiedField={copiedField}
							onCopy={copyValue}
							onSuspend={() => suspendMutation.mutate(credential.delegationId)}
							onReactivate={() =>
								reactivateMutation.mutate(credential.delegationId)
							}
							onRevoke={() => revokeMutation.mutate(credential.delegationId)}
							isSuspendPending={
								suspendMutation.isPending &&
								suspendMutation.variables === credential.delegationId
							}
							isReactivatePending={
								reactivateMutation.isPending &&
								reactivateMutation.variables === credential.delegationId
							}
							isRevokePending={
								revokeMutation.isPending &&
								revokeMutation.variables === credential.delegationId
							}
						/>
					))}
				</div>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Onboard section                                                    */
/* ------------------------------------------------------------------ */

function OnboardSection({
	isCreating,
	onCreateOffer,
	agentName,
	onAgentNameChange,
	hasPendingOffer,
	latestPendingCredential,
	copiedField,
	onCopy,
}: {
	isCreating: boolean;
	onCreateOffer: () => void;
	agentName: string;
	onAgentNameChange: (value: string) => void;
	hasPendingOffer: boolean;
	latestPendingCredential: ManagedCredential | null;
	copiedField: string | null;
	onCopy: (key: string, value: string) => void;
}) {
	return (
		<>
			{/* Create offer card */}
			<Card className="overflow-hidden border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03]">
				<div className="flex flex-col sm:flex-row">
					{/* Left accent strip */}
					<div className="hidden sm:block w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/20 shrink-0" />

					<div className="flex-1">
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2.5">
								<div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
									<ShieldCheck className="h-4 w-4 text-primary" />
								</div>
								{hasPendingOffer
									? "Create Replacement Offer"
									: "Create Delegation Offer"}
							</CardTitle>
							<CardDescription className="leading-relaxed">
								{hasPendingOffer
									? "Issue a new offer to replace the pending one below. The new offer becomes active immediately."
									: "Generate an OID4VCI credential offer for the agent wallet. Share the offer link or deep link after creation."}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
									Delegated Agent Name
								</div>
								<Input
									aria-label="Delegated Agent Name"
									value={agentName}
									onChange={(event) => onAgentNameChange(event.target.value)}
									placeholder="Ticket Booker Alpha"
									maxLength={80}
									disabled={isCreating}
								/>
							</div>
							<Button
								onClick={onCreateOffer}
								disabled={isCreating || agentName.trim().length === 0}
								className="w-full sm:w-auto h-10 text-sm font-semibold gap-2 group"
							>
								{isCreating ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Creating…
									</>
								) : (
									<>
										<ShieldCheck className="h-4 w-4" />
										{hasPendingOffer ? "Replace Offer" : "Create Offer"}
										<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
									</>
								)}
							</Button>
						</CardContent>
					</div>
				</div>
			</Card>

			{/* Pending offer details */}
			{latestPendingCredential ? (
				<PendingOfferCard
					credential={latestPendingCredential}
					copiedField={copiedField}
					onCopy={onCopy}
				/>
			) : null}

			{/* Scope info */}
			<div className="flex items-start gap-3.5 px-4 py-3.5 rounded-xl bg-primary/[0.03] border border-primary/10">
				<Shield className="h-4 w-4 text-primary/40 shrink-0 mt-0.5" />
				<div>
					<p className="text-xs font-semibold text-foreground/80 mb-0.5">
						{BOOKING_SCOPE.label}
					</p>
					<p className="text-xs text-muted-foreground leading-relaxed">
						{BOOKING_SCOPE.description}
					</p>
				</div>
			</div>
		</>
	);
}

/* ------------------------------------------------------------------ */
/*  Pending offer card (onboard page)                                  */
/* ------------------------------------------------------------------ */

function PendingOfferCard({
	credential,
	copiedField,
	onCopy,
}: {
	credential: ManagedCredential;
	copiedField: string | null;
	onCopy: (key: string, value: string) => void;
}) {
	const isRedeeming = credential.state === "offer_redeeming";
	const isExpired = credential.state === "offer_expired";

	return (
		<Card className="overflow-hidden border-border/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-violet-900/[0.03]">
			<div className="flex flex-col sm:flex-row">
				{/* Status accent */}
				<div
					className={`hidden sm:block w-1 shrink-0 ${
						isExpired
							? "bg-gradient-to-b from-amber-400 via-amber-300 to-amber-200"
							: isRedeeming
								? "bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200"
								: "bg-gradient-to-b from-violet-400 via-violet-300 to-violet-200"
					}`}
				/>

				<div className="flex-1">
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<Clock className="h-3.5 w-3.5 text-muted-foreground" />
								{credential.agentName}
								<span className="font-mono text-xs text-muted-foreground/60">
									{shortId(credential.delegationId)}
								</span>
							</CardTitle>
							<div className="flex gap-1.5">
								<StateBadge state={credential.state} />
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Offer details row */}
						<div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
							{credential.offerExpiresAt && (
								<DetailInline
									label="Expires"
									value={formatDateTime(credential.offerExpiresAt)}
								/>
							)}
							{credential.validUntil && (
								<DetailInline
									label="Valid until"
									value={formatDateTime(credential.validUntil)}
								/>
							)}
							<DetailInline label="Agent" value={credential.agentName} />
							<DetailInline
								label="Scopes"
								value={credential.scopes.join(", ")}
							/>
						</div>

						{/* Offer URLs */}
						{credential.credentialOfferDeepLink ? (
							<div className="space-y-3">
								<OfferPanel
									icon={<Smartphone className="h-3.5 w-3.5 text-primary" />}
									title="OpenID Credential Offer Link"
									value={credential.credentialOfferDeepLink}
									copied={
										copiedField === `${credential.delegationId}:deep-link`
									}
									onCopy={() =>
										onCopy(
											`${credential.delegationId}:deep-link`,
											credential.credentialOfferDeepLink ?? "",
										)
									}
								/>
							</div>
						) : null}

						{/* Status note */}
						{isRedeeming && (
							<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50/80 border border-blue-100/60 text-xs text-blue-700">
								<Loader2 className="h-3 w-3 animate-spin shrink-0" />
								The wallet is currently redeeming this offer…
							</div>
						)}
						{isExpired && (
							<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50/80 border border-amber-100/60 text-xs text-amber-700">
								<Clock className="h-3 w-3 shrink-0" />
								This offer has expired. Create a replacement above.
							</div>
						)}
					</CardContent>
				</div>
			</div>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Credential card (list page)                                        */
/* ------------------------------------------------------------------ */

function CredentialCard({
	credential,
	copiedField,
	onCopy,
	onSuspend,
	onReactivate,
	onRevoke,
	isSuspendPending,
	isReactivatePending,
	isRevokePending,
}: {
	credential: ManagedCredential & {
		status: "active" | "suspended" | "revoked";
	};
	copiedField: string | null;
	onCopy: (key: string, value: string) => void;
	onSuspend: () => void;
	onReactivate: () => void;
	onRevoke: () => void;
	isSuspendPending: boolean;
	isReactivatePending: boolean;
	isRevokePending: boolean;
}) {
	const [expanded, setExpanded] = useState(false);
	const holderKey = useMemo(
		() => formatHolderKey(credential.holderPublicKey),
		[credential.holderPublicKey],
	);

	const statusAccent = {
		active: "bg-gradient-to-b from-emerald-400 via-emerald-300 to-emerald-200",
		suspended: "bg-gradient-to-b from-amber-400 via-amber-300 to-amber-200",
		revoked: "bg-gradient-to-b from-rose-400 via-rose-300 to-rose-200",
	} as const;

	/** Only show dates that are non-null and relevant to the current status */
	const relevantDates = useMemo(() => {
		const dates: Array<{ label: string; value: string | null }> = [];
		dates.push({ label: "Issued", value: credential.credentialIssuedAt });
		dates.push({ label: "Valid until", value: credential.validUntil });
		if (credential.status === "suspended") {
			dates.push({
				label: "Suspended",
				value: credential.credentialSuspendedAt,
			});
		}
		if (credential.status === "revoked") {
			dates.push({ label: "Revoked", value: credential.credentialRevokedAt });
		}
		return dates.filter((d) => d.value !== null);
	}, [credential]);

	return (
		<Card className="overflow-hidden border-border/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-200">
			<div className="flex flex-col sm:flex-row">
				{/* Status accent strip */}
				<div
					className={`hidden sm:block w-1 shrink-0 ${statusAccent[credential.status]}`}
				/>

				<div className="flex-1 min-w-0">
					{/* Header row */}
					<div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
						<div className="flex items-center gap-2.5 min-w-0">
							<div className="h-8 w-8 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
								<Bot className="h-4 w-4 text-foreground/50" />
							</div>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<span className="text-sm font-semibold tracking-tight truncate">
										{credential.agentName}
									</span>
									<span className="font-mono text-[11px] text-muted-foreground/50 truncate">
										{shortId(credential.delegationId)}
									</span>
								</div>
								<div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
									{relevantDates.map((d) => (
										<span
											key={d.label}
											className="text-[11px] text-muted-foreground/60"
										>
											{d.label}:{" "}
											<span className="text-foreground/60 font-mono">
												{formatDateTime(d.value)}
											</span>
										</span>
									))}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2 shrink-0">
							<StatusBadge status={credential.status} />
						</div>
					</div>

					{/* Scopes + actions */}
					<div className="px-5 pb-4 flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-1.5">
							<span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/50">
								Scope
							</span>
							<Badge
								variant="secondary"
								className="text-[11px] font-mono tracking-tight"
							>
								{credential.scopes.join(", ")}
							</Badge>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							{credential.status === "active" && (
								<Button
									onClick={onSuspend}
									disabled={isSuspendPending || isRevokePending}
									variant="outline"
									size="xs"
									className="gap-1"
								>
									{isSuspendPending ? (
										<Loader2 className="h-3 w-3 animate-spin" />
									) : (
										<PauseCircle className="h-3 w-3" />
									)}
									Suspend
								</Button>
							)}

							{credential.status === "suspended" && (
								<Button
									onClick={onReactivate}
									disabled={isReactivatePending || isRevokePending}
									variant="outline"
									size="xs"
									className="gap-1"
								>
									{isReactivatePending ? (
										<Loader2 className="h-3 w-3 animate-spin" />
									) : (
										<PlayCircle className="h-3 w-3" />
									)}
									Reactivate
								</Button>
							)}

							{credential.status !== "revoked" && (
								<Button
									onClick={onRevoke}
									disabled={
										isRevokePending || isSuspendPending || isReactivatePending
									}
									variant="destructive"
									size="xs"
									className="gap-1"
								>
									{isRevokePending ? (
										<Loader2 className="h-3 w-3 animate-spin" />
									) : (
										<Ban className="h-3 w-3" />
									)}
									Revoke
								</Button>
							)}

							{holderKey && (
								<Button
									variant="ghost"
									size="xs"
									onClick={() => setExpanded(!expanded)}
									className="gap-1 text-muted-foreground"
								>
									<KeyRound className="h-3 w-3" />
									{expanded ? "Hide Key" : "Show Key"}
								</Button>
							)}
						</div>
					</div>

					{/* Expandable binding key */}
					{expanded && holderKey && (
						<div className="px-5 pb-4 animate-slide-up">
							<div className="rounded-lg bg-gray-950 border border-gray-800 p-3 overflow-x-auto">
								<div className="flex items-center justify-between gap-2 mb-2">
									<span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
										Agent Binding Key
									</span>
									<Button
										variant="ghost"
										size="xs"
										onClick={() =>
											onCopy(`${credential.delegationId}:key`, holderKey)
										}
										className="h-5 px-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
									>
										{copiedField === `${credential.delegationId}:key` ? (
											<Check className="h-3 w-3" />
										) : (
											<Copy className="h-3 w-3" />
										)}
									</Button>
								</div>
								<pre className="font-mono text-[11px] text-gray-300 whitespace-pre-wrap break-all leading-relaxed">
									{holderKey}
								</pre>
							</div>
						</div>
					)}
				</div>
			</div>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyCredentialsState() {
	return (
		<div className="relative rounded-xl border border-dashed border-border/60 bg-secondary/20 px-6 py-12 text-center">
			<div className="mx-auto h-12 w-12 rounded-xl bg-secondary/60 flex items-center justify-center mb-4">
				<Bot className="h-6 w-6 text-muted-foreground/40" />
			</div>
			<h3 className="text-sm font-semibold text-foreground/80 mb-1">
				No issued credentials yet
			</h3>
			<p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
				Create and redeem an offer from the onboarding page. Issued credentials
				will appear here once the wallet completes redemption.
			</p>
			<Button asChild size="sm" variant="outline" className="mt-5">
				<Link to="/agent/onboard">
					<ShieldCheck className="h-3.5 w-3.5" />
					Onboard Agent
				</Link>
			</Button>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Offer panel (copy-able URL block)                                  */
/* ------------------------------------------------------------------ */

function OfferPanel({
	icon,
	title,
	value,
	copied,
	onCopy,
}: {
	icon: React.ReactNode;
	title: string;
	value: string;
	copied: boolean;
	onCopy: () => void;
}) {
	return (
		<div className="rounded-lg border border-border/50 bg-secondary/20 overflow-hidden">
			<div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/30">
				<div className="flex items-center gap-2 text-xs font-medium text-foreground/70">
					{icon}
					{title}
				</div>
				<Button
					onClick={onCopy}
					variant="ghost"
					size="xs"
					className="gap-1 text-muted-foreground shrink-0"
				>
					{copied ? (
						<>
							<Check className="h-3 w-3 text-emerald-600" />
							<span className="text-emerald-600">Copied</span>
						</>
					) : (
						<>
							<Copy className="h-3 w-3" />
							Copy
						</>
					)}
				</Button>
			</div>
			<div className="p-3 overflow-x-auto">
				<pre className="font-mono text-[11px] text-foreground/60 whitespace-pre-wrap break-all select-all leading-relaxed">
					{value}
				</pre>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Inline detail                                                      */
/* ------------------------------------------------------------------ */

function DetailInline({
	label,
	value,
}: {
	label: string;
	value: string | null;
}) {
	if (!value) return null;
	return (
		<span className="text-[11px] text-muted-foreground">
			{label}: <span className="font-mono text-foreground/60">{value}</span>
		</span>
	);
}

/* ------------------------------------------------------------------ */
/*  Badges                                                             */
/* ------------------------------------------------------------------ */

function StateBadge({ state }: { state: ManagedCredential["state"] }) {
	const config: Record<
		ManagedCredential["state"],
		{ label: string; className: string }
	> = {
		offer_ready: {
			label: "Ready",
			className: "border-violet-200 bg-violet-50 text-violet-700",
		},
		offer_redeeming: {
			label: "Redeeming",
			className: "border-blue-200 bg-blue-50 text-blue-700",
		},
		offer_expired: {
			label: "Expired",
			className: "border-amber-200 bg-amber-50 text-amber-700",
		},
		credential_active: {
			label: "Active",
			className: "border-emerald-200 bg-emerald-50 text-emerald-700",
		},
		credential_suspended: {
			label: "Suspended",
			className: "border-amber-200 bg-amber-50 text-amber-700",
		},
		credential_revoked: {
			label: "Revoked",
			className: "border-rose-200 bg-rose-50 text-rose-700",
		},
	};

	const { label, className } = config[state];
	return (
		<Badge variant="outline" className={className}>
			{label}
		</Badge>
	);
}

function StatusBadge({
	status,
}: {
	status: "active" | "suspended" | "revoked";
}) {
	const config = {
		active: {
			label: "Active",
			className: "border-emerald-200 bg-emerald-50 text-emerald-700",
		},
		suspended: {
			label: "Suspended",
			className: "border-amber-200 bg-amber-50 text-amber-700",
		},
		revoked: {
			label: "Revoked",
			className: "border-rose-200 bg-rose-50 text-rose-700",
		},
	} as const;

	const { label, className } = config[status];
	return (
		<Badge variant="outline" className={className}>
			{label}
		</Badge>
	);
}
