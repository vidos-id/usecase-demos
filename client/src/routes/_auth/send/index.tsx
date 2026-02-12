import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_auth/send/")({
	component: SendMoneyPage,
});

const TEMPLATES = [
	{ recipient: "John's Coffee Shop", amount: 45.0 },
	{ recipient: "Maria Garcia", amount: 200.0 },
	{ recipient: "Rent Payment", amount: 850.0 },
];

function SendMoneyPage() {
	const navigate = useNavigate();
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");
	const [reference, setReference] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Format amount as EUR string with 2 decimal places
		const formattedAmount = Number.parseFloat(amount).toFixed(2);
		navigate({
			to: "/send/confirm",
			search: {
				recipient,
				amount: formattedAmount,
				reference: reference || undefined,
			},
		});
	};

	const selectTemplate = (t: (typeof TEMPLATES)[0]) => {
		setRecipient(t.recipient);
		setAmount(t.amount.toString());
	};

	return (
		<div className="max-w-xl mx-auto px-4 py-8">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-4">
						<CardTitle>Send Money</CardTitle>
						<Button asChild variant="outline" size="sm">
							<Link to="/dashboard">Back to Dashboard</Link>
						</Button>
					</div>
					<CardDescription>Transfer funds to another account</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label>Quick Templates</Label>
							<div className="flex flex-wrap gap-2">
								{TEMPLATES.map((t) => (
									<Button
										key={t.recipient}
										type="button"
										variant="outline"
										size="sm"
										onClick={() => selectTemplate(t)}
									>
										{t.recipient} - EUR {t.amount.toFixed(2)}
									</Button>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="recipient">Recipient</Label>
							<Input
								id="recipient"
								value={recipient}
								onChange={(e) => setRecipient(e.target.value)}
								placeholder="Name or account"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="amount">Amount (EUR)</Label>
							<Input
								id="amount"
								type="number"
								step="0.01"
								min="0.01"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="0.00"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="reference">Reference (optional)</Label>
							<Input
								id="reference"
								value={reference}
								onChange={(e) => setReference(e.target.value)}
								placeholder="Payment reference"
							/>
						</div>

						<Button
							type="submit"
							className="w-full"
							size="lg"
							disabled={!recipient || !amount}
						>
							Continue
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
