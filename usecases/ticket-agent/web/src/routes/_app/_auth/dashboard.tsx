import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowRight,
	Bot,
	CalendarDays,
	CheckCircle2,
	Fingerprint,
	Loader2,
	Shield,
	Sparkles,
	Ticket,
	XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import type { AuthenticatedUser } from "../_auth";

export const Route = createFileRoute("/_app/_auth/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const navigate = useNavigate();
	const routeContext = useRouteContext({ from: "/_app/_auth" }) as {
		user: AuthenticatedUser;
	};
	const userQuery = useQuery({
		queryKey: ["me"],
		queryFn: async () => {
			const res = await apiClient.api.me.$get({});
			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
		initialData: routeContext.user,
		staleTime: 5_000,
		refetchInterval: (query) => {
			const currentUser = query.state.data as AuthenticatedUser | undefined;
			const delegationState = currentUser?.delegation?.state;

			return delegationState === "offer_ready" ||
				delegationState === "offer_redeeming"
				? 2_000
				: false;
		},
	});
	const user = userQuery.data as AuthenticatedUser;
	const credentials = user.delegatedCredentials ?? [];
	const hasActiveCredential = credentials.some(
		(credential) => credential.status === "active",
	);
	const hasPendingOffer = credentials.some(
		(credential) => credential.status === null,
	);
	const hasSuspendedCredential = credentials.some(
		(credential) => credential.status === "suspended",
	);
	const hasRevokedCredential = credentials.some(
		(credential) => credential.status === "revoked",
	);

	const delegationState = hasActiveCredential
		? "credential_active"
		: hasPendingOffer
			? (user.delegation?.state ?? "offer_ready")
			: hasSuspendedCredential
				? "credential_suspended"
				: hasRevokedCredential
					? "credential_revoked"
					: null;

	const agentStatus = (() => {
		switch (delegationState) {
			case "credential_active":
				return {
					badgeClassName:
						"border-emerald-200 bg-emerald-50 text-emerald-700 gap-1",
					badgeLabel: "Active",
					icon: CheckCircle2,
					description:
						"Your AI agent is active and ready to act on your behalf.",
					ctaLabel: "View Credentials",
					ctaTo: "/agent" as const,
				};
			case "credential_suspended":
				return {
					badgeClassName: "border-amber-200 bg-amber-50 text-amber-700 gap-1",
					badgeLabel: "Suspended",
					icon: AlertTriangle,
					description:
						"One of your delegated credentials is suspended and can be reactivated from the agent page.",
					ctaLabel: "Manage Credentials",
					ctaTo: "/agent" as const,
				};
			case "credential_revoked":
				return {
					badgeClassName: "border-rose-200 bg-rose-50 text-rose-700 gap-1",
					badgeLabel: "Revoked",
					icon: XCircle,
					description:
						"A delegated credential was revoked. You can issue another without affecting any other active credentials.",
					ctaLabel: "Manage Credentials",
					ctaTo: "/agent" as const,
				};
			case "offer_redeeming":
				return {
					badgeClassName: "border-blue-200 bg-blue-50 text-blue-700 gap-1",
					badgeLabel: "Redeeming",
					icon: Loader2,
					description:
						"Your agent wallet has started redeeming the credential. We will mark it active once issuance completes.",
					ctaLabel: "View Agent Status",
					ctaTo: "/agent" as const,
				};
			case "offer_expired":
				return {
					badgeClassName: "border-amber-200 bg-amber-50 text-amber-700 gap-1",
					badgeLabel: "Offer Expired",
					icon: AlertTriangle,
					description:
						"Your last delegation offer expired. Create a replacement offer to continue onboarding the agent.",
					ctaLabel: "Create New Offer",
					ctaTo: "/agent/onboard" as const,
				};
			case "offer_ready":
				return {
					badgeClassName:
						"border-violet-200 bg-violet-50 text-violet-700 gap-1",
					badgeLabel: "Offer Ready",
					icon: Bot,
					description:
						"Your delegation offer is ready to share with the agent wallet.",
					ctaLabel: "Open Offer",
					ctaTo: "/agent" as const,
				};
			default:
				return {
					badgeClassName:
						"border-muted-foreground/20 bg-muted/50 text-muted-foreground gap-1",
					badgeLabel: "Not Onboarded",
					icon: XCircle,
					description: "Onboard your AI agent to delegate ticket purchases.",
					ctaLabel: "Onboard Agent",
					ctaTo: "/agent/onboard" as const,
				};
		}
	})();
	const AgentStatusIcon = agentStatus.icon;

	const displayName =
		user.givenName && user.familyName
			? `${user.givenName} ${user.familyName}`
			: user.username;

	return (
		<div className="space-y-8 animate-slide-up">
			{/* Welcome */}
			<div className="space-y-2">
				<div className="flex items-center gap-2.5">
					<Sparkles className="h-5 w-5 text-primary/60" />
					<p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
						Dashboard
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Welcome back, {displayName}
				</h1>
				<p className="text-muted-foreground text-sm max-w-lg">
					Manage your identity, configure your AI agent, and browse upcoming
					events.
				</p>
			</div>

			{/* Status cards */}
			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{/* Identity Status */}
				<Card
					onClick={() => navigate({ to: "/identity" })}
					className="group cursor-pointer border-border/50 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5"
				>
					<CardContent className="p-6 space-y-4">
						<div className="flex items-start justify-between">
							<div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center border border-violet-200/40 transition-transform duration-300 group-hover:scale-105">
								<Fingerprint className="h-5 w-5 text-violet-600" />
							</div>
							{user.identityVerified ? (
								<Badge
									variant="outline"
									className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1"
								>
									<CheckCircle2 className="h-3 w-3" />
									Verified
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="border-amber-200 bg-amber-50 text-amber-700 gap-1"
								>
									<XCircle className="h-3 w-3" />
									Not Verified
								</Badge>
							)}
						</div>
						<div className="space-y-1">
							<h3 className="font-semibold tracking-tight">Identity Status</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{user.identityVerified
									? `Verified as ${user.givenName} ${user.familyName}`
									: "Present your PID credential to verify your identity."}
							</p>
						</div>
						{!user.identityVerified && (
							<Button
								asChild
								onClick={(event) => event.stopPropagation()}
								variant="outline"
								size="sm"
								className="w-full border-primary/20 text-primary hover:bg-primary/5 group/btn"
							>
								<Link to="/identity">
									Verify Identity
									<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
								</Link>
							</Button>
						)}
					</CardContent>
				</Card>

				{/* Agent Status */}
				<Card
					onClick={() => navigate({ to: agentStatus.ctaTo })}
					className="group cursor-pointer border-border/50 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5"
				>
					<CardContent className="p-6 space-y-4">
						<div className="flex items-start justify-between">
							<div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center border border-indigo-200/40 transition-transform duration-300 group-hover:scale-105">
								<Bot className="h-5 w-5 text-indigo-600" />
							</div>
							<Badge variant="outline" className={agentStatus.badgeClassName}>
								<AgentStatusIcon
									className={`h-3 w-3 ${
										delegationState === "offer_redeeming" ? "animate-spin" : ""
									}`}
								/>
								{agentStatus.badgeLabel}
							</Badge>
						</div>
						<div className="space-y-1">
							<h3 className="font-semibold tracking-tight">Agent Status</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{agentStatus.description}
							</p>
						</div>
						{agentStatus.ctaLabel ? (
							<Button
								asChild
								onClick={(event) => event.stopPropagation()}
								variant="outline"
								size="sm"
								className="w-full border-primary/20 text-primary hover:bg-primary/5 group/btn"
							>
								<Link to={agentStatus.ctaTo}>
									{agentStatus.ctaLabel}
									<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
								</Link>
							</Button>
						) : null}
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card
					onClick={() => navigate({ to: "/events" })}
					className="group cursor-pointer border-border/50 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1"
				>
					<CardContent className="p-6 space-y-4">
						<div className="flex items-start justify-between">
							<div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-200/40 transition-transform duration-300 group-hover:scale-105">
								<Sparkles className="h-5 w-5 text-amber-600" />
							</div>
						</div>
						<div className="space-y-1">
							<h3 className="font-semibold tracking-tight">Quick Actions</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Jump to the most common tasks.
							</p>
						</div>
						<div className="flex flex-col gap-2">
							<Button
								asChild
								onClick={(event) => event.stopPropagation()}
								variant="outline"
								size="sm"
								className="w-full justify-start gap-2 border-border/60 hover:bg-primary/5 hover:border-primary/20 hover:text-primary"
							>
								<Link to="/events">
									<CalendarDays className="h-3.5 w-3.5" />
									Browse Events
								</Link>
							</Button>
							<Button
								asChild
								onClick={(event) => event.stopPropagation()}
								variant="outline"
								size="sm"
								className="w-full justify-start gap-2 border-border/60 hover:bg-primary/5 hover:border-primary/20 hover:text-primary"
							>
								<Link to="/bookings">
									<Ticket className="h-3.5 w-3.5" />
									My Bookings
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Info strip */}
			<div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-primary/[0.03] border border-primary/10">
				<Shield className="h-5 w-5 text-primary/50 shrink-0" />
				<p className="text-sm text-muted-foreground leading-relaxed">
					<span className="font-medium text-foreground/80">How it works:</span>{" "}
					Verify your identity, onboard your AI agent with a delegation
					credential, then let it autonomously purchase event tickets on your
					behalf.
				</p>
			</div>
		</div>
	);
}
