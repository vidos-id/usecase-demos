import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface SuccessSearchParams {
	transactionId: string;
	recipient: string;
	amount: string; // EUR format string "123.45"
	reference?: string;
	confirmedAt: string;
}

export const Route = createFileRoute("/_auth/send/success")({
	validateSearch: (
		search: Record<string, unknown>,
	): SuccessSearchParams | undefined => {
		if (
			typeof search.transactionId === "string" &&
			typeof search.recipient === "string" &&
			typeof search.amount === "string" &&
			typeof search.confirmedAt === "string"
		) {
			return {
				transactionId: search.transactionId,
				recipient: search.recipient,
				amount: search.amount,
				reference:
					typeof search.reference === "string" ? search.reference : undefined,
				confirmedAt: search.confirmedAt,
			};
		}
		return undefined;
	},
	component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
	const navigate = useNavigate();
	const search = Route.useSearch();

	// Redirect if no search params
	useEffect(() => {
		if (!search) {
			navigate({ to: "/dashboard" });
		}
	}, [search, navigate]);

	if (!search) return null;

	const confirmedDate = new Date(search.confirmedAt);

	return (
		<div className="max-w-xl mx-auto px-4 py-8">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<CheckCircle2 className="h-8 w-8 text-green-600" />
						<div>
							<CardTitle>Payment Confirmed</CardTitle>
							<CardDescription>
								Your payment has been verified and processed
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Demo Mode Notice */}
					<Alert>
						<AlertDescription>
							<strong>Demo mode:</strong> Your balance has not been updated. In
							a production environment, this payment would be processed
							immediately.
						</AlertDescription>
					</Alert>

					{/* Transaction Details */}
					<div className="bg-muted p-4 rounded-lg space-y-3">
						<h3 className="font-semibold">Transaction Details</h3>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div className="text-muted-foreground">Transaction ID:</div>
							<div className="font-mono text-xs">{search.transactionId}</div>
							<div className="text-muted-foreground">Recipient:</div>
							<div className="font-medium">{search.recipient}</div>
							<div className="text-muted-foreground">Amount:</div>
							<div className="font-medium">EUR {search.amount}</div>
							{search.reference && (
								<>
									<div className="text-muted-foreground">Reference:</div>
									<div className="font-medium">{search.reference}</div>
								</>
							)}
							<div className="text-muted-foreground">Confirmed:</div>
							<div>
								{confirmedDate.toLocaleDateString("en-GB", {
									year: "numeric",
									month: "short",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</div>
						</div>
					</div>

					{/* Verification Notice */}
					<div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
						<p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
							Verified Identity
						</p>
						<p className="text-blue-700 dark:text-blue-200">
							This payment was confirmed using your EUDI Wallet credentials,
							ensuring secure identity verification.
						</p>
					</div>

					{/* Action Button */}
					<Link to="/dashboard">
						<Button className="w-full" size="lg">
							Back to Dashboard
						</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
