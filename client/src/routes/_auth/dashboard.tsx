import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { hcWithType } from "server/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionId } from "@/lib/auth";

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
	},
	{
		id: "2",
		date: "2026-02-10",
		merchant: "Supermart Groceries",
		amount: -87.45,
	},
	{
		id: "3",
		date: "2026-02-09",
		merchant: "Coffee Corner",
		amount: -4.8,
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
		<div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
			{/* Welcome */}
			<div>
				<h1 className="text-3xl font-bold">
					Welcome, {user?.givenName} {user?.familyName}
				</h1>
				<p className="text-muted-foreground">Your banking dashboard</p>
			</div>

			{/* Balance Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Available Balance
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-4xl font-bold">
						EUR{" "}
						{FAKE_BALANCE.toLocaleString("de-DE", {
							minimumFractionDigits: 2,
						})}
					</p>
				</CardContent>
			</Card>

			{/* Actions */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Button asChild size="lg" className="h-auto py-4">
					<Link to="/send">Send Money</Link>
				</Button>
				<Button asChild size="lg" variant="outline" className="h-auto py-4">
					<Link to="/loan">Apply for Loan</Link>
				</Button>
				<Button asChild size="lg" variant="outline" className="h-auto py-4">
					<Link to="/profile">View Profile</Link>
				</Button>
			</div>

			{/* Recent Transactions */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Transactions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{FAKE_TRANSACTIONS.map((tx) => (
							<div
								key={tx.id}
								className="flex items-center justify-between py-2 border-b last:border-0"
							>
								<div>
									<p className="font-medium">{tx.merchant}</p>
									<p className="text-sm text-muted-foreground">{tx.date}</p>
								</div>
								<p
									className={
										tx.amount > 0 ? "text-green-600 font-medium" : "font-medium"
									}
								>
									{tx.amount > 0 ? "+" : ""}EUR{" "}
									{tx.amount.toLocaleString("de-DE", {
										minimumFractionDigits: 2,
									})}
								</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
