import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowDownLeft,
	ArrowUpRight,
	CreditCard,
	FileText,
	Send,
	TrendingUp,
	User,
} from "lucide-react";
import { hcWithType } from "server/client";
import { Button } from "@/components/ui/button";
import { getSessionId } from "@/lib/auth";
import { cn } from "@/lib/utils";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const client = hcWithType(SERVER_URL);

export const Route = createFileRoute("/_auth/dashboard")({
	component: DashboardPage,
});

const FAKE_BALANCE = 12450.0;

const FAKE_TRANSACTIONS = [
	{
		id: "1",
		date: "2026-02-11",
		merchant: "Salary Deposit",
		amount: 3500.0,
		type: "income",
	},
	{
		id: "2",
		date: "2026-02-10",
		merchant: "Supermart Groceries",
		amount: -87.45,
		type: "expense",
	},
	{
		id: "3",
		date: "2026-02-09",
		merchant: "Coffee Corner",
		amount: -4.8,
		type: "expense",
	},
	{
		id: "4",
		date: "2026-02-08",
		merchant: "Electric Bill",
		amount: -124.0,
		type: "expense",
	},
];

function DashboardPage() {
	const sessionId = getSessionId();

	const { data: user } = useQuery({
		queryKey: ["user", "me"],
		queryFn: async () => {
			const res = await client.api.users.me.$get(
				{},
				{
					headers: { Authorization: `Bearer ${sessionId}` },
				},
			);
			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
	});

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
									{FAKE_BALANCE.toLocaleString("de-DE", {
										style: "currency",
										currency: "EUR",
									})}
								</p>
							</div>
							<div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
								<CreditCard className="h-6 w-6" />
							</div>
						</div>

						<div className="flex items-center gap-4 text-sm">
							<div className="flex items-center gap-1.5 opacity-80">
								<TrendingUp className="h-4 w-4" />
								<span>+2.4% this month</span>
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
						<span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
							Last 30 days
						</span>
					</div>

					<div className="rounded-xl border border-border/60 bg-background overflow-hidden">
						{FAKE_TRANSACTIONS.map((tx, index) => (
							<div
								key={tx.id}
								className={cn(
									"flex items-center gap-4 p-4 transition-colors hover:bg-muted/30",
									index !== FAKE_TRANSACTIONS.length - 1 &&
										"border-b border-border/40",
								)}
							>
								{/* Icon */}
								<div
									className={cn(
										"h-10 w-10 rounded-xl flex items-center justify-center",
										tx.amount > 0
											? "bg-green-500/10 text-green-600"
											: "bg-muted text-muted-foreground",
									)}
								>
									{tx.amount > 0 ? (
										<ArrowDownLeft className="h-5 w-5" />
									) : (
										<ArrowUpRight className="h-5 w-5" />
									)}
								</div>

								{/* Details */}
								<div className="flex-1 min-w-0">
									<p className="font-medium truncate">{tx.merchant}</p>
									<p className="text-sm text-muted-foreground font-mono">
										{new Date(tx.date).toLocaleDateString("en-GB", {
											day: "numeric",
											month: "short",
										})}
									</p>
								</div>

								{/* Amount */}
								<p
									className={cn(
										"font-mono font-medium tabular-nums",
										tx.amount > 0 ? "text-green-600" : "text-foreground",
									)}
								>
									{tx.amount > 0 ? "+" : ""}
									{tx.amount.toLocaleString("de-DE", {
										style: "currency",
										currency: "EUR",
									})}
								</p>
							</div>
						))}
					</div>
				</div>

				{/* Demo Notice */}
				<div className="rounded-xl bg-muted/30 border border-border/40 p-4 text-center">
					<p className="text-sm text-muted-foreground">
						<span className="font-medium">Demo Mode</span> — Transactions shown
						are simulated. Your PID credentials are real.
					</p>
				</div>
			</div>
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
