import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import {
	ArrowRight,
	Bot,
	CalendarDays,
	CheckCircle2,
	Fingerprint,
	Shield,
	Sparkles,
	Ticket,
	XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_app/_auth/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const { user } = useRouteContext({ from: "/_app/_auth" });

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
				<Card className="group border-border/50 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5">
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
				<Card className="group border-border/50 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5">
					<CardContent className="p-6 space-y-4">
						<div className="flex items-start justify-between">
							<div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center border border-indigo-200/40 transition-transform duration-300 group-hover:scale-105">
								<Bot className="h-5 w-5 text-indigo-600" />
							</div>
							{user.hasActiveAgent ? (
								<Badge
									variant="outline"
									className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1"
								>
									<CheckCircle2 className="h-3 w-3" />
									Active
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="border-muted-foreground/20 bg-muted/50 text-muted-foreground gap-1"
								>
									<XCircle className="h-3 w-3" />
									Not Onboarded
								</Badge>
							)}
						</div>
						<div className="space-y-1">
							<h3 className="font-semibold tracking-tight">Agent Status</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{user.hasActiveAgent
									? "Your AI agent is active and ready to act on your behalf."
									: "Onboard your AI agent to delegate ticket purchases."}
							</p>
						</div>
						{!user.hasActiveAgent && (
							<Button
								asChild
								variant="outline"
								size="sm"
								className="w-full border-primary/20 text-primary hover:bg-primary/5 group/btn"
							>
								<Link to="/agent">
									Onboard Agent
									<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
								</Link>
							</Button>
						)}
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card className="group border-border/50 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1">
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
