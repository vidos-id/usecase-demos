import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import {
	ArrowDownLeft,
	ArrowUpRight,
	CreditCard,
	FileText,
	Filter,
	Send,
	TrendingUp,
	User,
} from "lucide-react";
import { useState } from "react";
import type { ActivityItem } from "shared/api/users-me";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/dashboard")({
	component: DashboardPage,
});

type ActivityFilter = "all" | "payment" | "loan";

function DashboardPage() {
	const { apiClient } = useRouteContext({ from: "__root__" });
	const [filter, setFilter] = useState<ActivityFilter>("all");

	const { data: user } = useQuery({
		queryKey: ["user", "me"],
		queryFn: async () => {
			const res = await apiClient.api.profile.me.$get({});
			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
	});

	const balance = user?.balance ?? 0;
	const pendingLoans = user?.pendingLoansTotal ?? 0;
	const activity = user?.activity ?? [];

	const filteredActivity =
		filter === "all" ? activity : activity.filter((a) => a.type === filter);

	return (
		<div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-5xl mx-auto space-y-8">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
							Welcome back
						</p>
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
							{user?.givenName} {user?.familyName}
						</h1>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
						<span className="font-mono uppercase tracking-wider">
							Account Active
						</span>
					</div>
				</div>

				{/* Balance Card */}
				<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-6 sm:p-8 text-primary-foreground">
					{/* Background pattern */}
					<div className="absolute inset-0 opacity-10">
						<div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
						<div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
					</div>

					<div className="relative z-10">
						<div className="flex items-start justify-between mb-6">
							<div>
								<p className="text-sm opacity-80 font-medium mb-1">
									Available Balance
								</p>
								<p className="text-4xl sm:text-5xl font-bold tracking-tight font-mono">
									{balance.toLocaleString("de-DE", {
										style: "currency",
										currency: "EUR",
									})}
								</p>
								{pendingLoans > 0 && (
									<p className="text-sm opacity-70 mt-2 font-mono">
										Pending loans:{" "}
										{pendingLoans.toLocaleString("de-DE", {
											style: "currency",
											currency: "EUR",
										})}
									</p>
								)}
							</div>
							<div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
								<CreditCard className="h-6 w-6" />
							</div>
						</div>

						<div className="flex items-center gap-4 text-sm">
							<div className="flex items-center gap-1.5 opacity-80">
								<TrendingUp className="h-4 w-4" />
								<span>Live demo balance</span>
							</div>
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="grid grid-cols-3 gap-3 sm:gap-4">
					<QuickAction
						href="/send"
						icon={<Send className="h-5 w-5" />}
						label="Send Money"
						primary
					/>
					<QuickAction
						href="/loan"
						icon={<FileText className="h-5 w-5" />}
						label="Apply for Loan"
					/>
					<QuickAction
						href="/profile"
						icon={<User className="h-5 w-5" />}
						label="View Profile"
					/>
				</div>

				{/* Transactions */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Recent Activity</h2>
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<select
								value={filter}
								onChange={(e) => setFilter(e.target.value as ActivityFilter)}
								className="text-xs font-mono uppercase tracking-wider bg-transparent border-none text-muted-foreground cursor-pointer focus:outline-none"
							>
								<option value="all">All</option>
								<option value="payment">Payments</option>
								<option value="loan">Loans</option>
							</select>
						</div>
					</div>

					<div className="rounded-xl border border-border/60 bg-background overflow-hidden">
						{filteredActivity.length === 0 ? (
							<div className="p-8 text-center text-muted-foreground">
								No activity to display
							</div>
						) : (
							filteredActivity.map((item, index) => (
								<ActivityRow
									key={item.id}
									item={item}
									isLast={index === filteredActivity.length - 1}
								/>
							))
						)}
					</div>
				</div>

				{/* Demo Notice */}
				<div className="rounded-xl bg-muted/30 border border-border/40 p-4 text-center">
					<p className="text-sm text-muted-foreground">
						<span className="font-medium">Demo Mode</span> — Balance and
						activity update in real-time for demo purposes. Your PID credentials
						are real.
					</p>
				</div>
			</div>
		</div>
	);
}

function ActivityRow({
	item,
	isLast,
}: {
	item: ActivityItem;
	isLast: boolean;
}) {
	const isLoan = item.type === "loan";
	const isPositive = item.amount > 0;

	return (
		<div
			className={cn(
				"flex items-center gap-4 p-4 transition-colors hover:bg-muted/30",
				!isLast && "border-b border-border/40",
			)}
		>
			{/* Icon */}
			<div
				className={cn(
					"h-10 w-10 rounded-xl flex items-center justify-center",
					isLoan
						? "bg-primary/10 text-primary"
						: isPositive
							? "bg-green-500/10 text-green-600"
							: "bg-muted text-muted-foreground",
				)}
			>
				{isLoan ? (
					<FileText className="h-5 w-5" />
				) : isPositive ? (
					<ArrowDownLeft className="h-5 w-5" />
				) : (
					<ArrowUpRight className="h-5 w-5" />
				)}
			</div>

			{/* Details */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<p className="font-medium truncate">{item.title}</p>
					{isLoan && (
						<span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
							Loan
						</span>
					)}
				</div>
				<p className="text-sm text-muted-foreground font-mono">
					{new Date(item.createdAt).toLocaleDateString("en-GB", {
						day: "numeric",
						month: "short",
					})}
				</p>
			</div>

			{/* Amount */}
			<p
				className={cn(
					"font-mono font-medium tabular-nums",
					isPositive ? "text-green-600" : "text-foreground",
				)}
			>
				{isPositive ? "+" : ""}
				{item.amount.toLocaleString("de-DE", {
					style: "currency",
					currency: "EUR",
				})}
			</p>
		</div>
	);
}

function QuickAction({
	href,
	icon,
	label,
	primary = false,
}: {
	href: string;
	icon: React.ReactNode;
	label: string;
	primary?: boolean;
}) {
	return (
		<Button
			asChild
			variant={primary ? "default" : "outline"}
			className={cn(
				"h-auto py-4 flex-col gap-2 rounded-xl",
				primary && "shadow-lg shadow-primary/20",
			)}
		>
			<Link to={href}>
				<div
					className={cn(
						"h-10 w-10 rounded-lg flex items-center justify-center",
						primary ? "bg-primary-foreground/20" : "bg-muted",
					)}
				>
					{icon}
				</div>
				<span className="text-sm font-medium">{label}</span>
			</Link>
		</Button>
	);
}
