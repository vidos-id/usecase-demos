import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/send/")({
	component: SendMoneyPage,
});

const TEMPLATES = [
	{ recipient: "John's Coffee Shop", amount: 45.0, emoji: "☕" },
	{ recipient: "Maria Garcia", amount: 200.0, emoji: "👤" },
	{ recipient: "Rent Payment", amount: 850.0, emoji: "🏠" },
];

function SendMoneyPage() {
	const navigate = useNavigate();
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");
	const [reference, setReference] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
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
		<div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-lg mx-auto space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<Button asChild variant="ghost" size="sm" className="gap-2">
						<Link to="/dashboard">
							<ArrowLeft className="h-4 w-4" />
							Dashboard
						</Link>
					</Button>
				</div>

				{/* Title section */}
				<div className="text-center space-y-2">
					<div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-2">
						<Send className="h-6 w-6 text-primary" />
					</div>
					<h1 className="text-2xl font-bold tracking-tight">Send Money</h1>
					<p className="text-muted-foreground">
						Transfer funds securely with wallet verification
					</p>
				</div>

				{/* Quick templates */}
				<div className="space-y-3">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Sparkles className="h-4 w-4" />
						<span>Quick Select</span>
					</div>
					<div className="grid grid-cols-3 gap-2">
						{TEMPLATES.map((t) => (
							<button
								key={t.recipient}
								type="button"
								onClick={() => selectTemplate(t)}
								className={cn(
									"flex flex-col items-center gap-1 p-3 rounded-xl border border-border/60 bg-background",
									"hover:border-primary/50 hover:bg-primary/5 transition-colors duration-200",
									recipient === t.recipient && "border-primary bg-primary/5",
								)}
							>
								<span className="text-xl">{t.emoji}</span>
								<span className="text-xs font-medium truncate w-full text-center">
									{t.recipient.split(" ")[0]}
								</span>
								<span className="text-[10px] text-muted-foreground font-mono">
									€{t.amount.toFixed(0)}
								</span>
							</button>
						))}
					</div>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-5">
					<div className="space-y-2">
						<Label
							htmlFor="recipient"
							className="text-xs uppercase tracking-wider text-muted-foreground"
						>
							Recipient
						</Label>
						<Input
							id="recipient"
							value={recipient}
							onChange={(e) => setRecipient(e.target.value)}
							placeholder="Name or account number"
							className="h-12 text-base"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label
							htmlFor="amount"
							className="text-xs uppercase tracking-wider text-muted-foreground"
						>
							Amount (EUR)
						</Label>
						<div className="relative">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
								€
							</span>
							<Input
								id="amount"
								type="number"
								step="0.01"
								min="0.01"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="0.00"
								className="h-12 text-base pl-8 font-mono"
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label
							htmlFor="reference"
							className="text-xs uppercase tracking-wider text-muted-foreground"
						>
							Reference{" "}
							<span className="normal-case text-muted-foreground/60">
								(optional)
							</span>
						</Label>
						<Input
							id="reference"
							value={reference}
							onChange={(e) => setReference(e.target.value)}
							placeholder="Payment reference"
							className="h-12 text-base"
						/>
					</div>

					<Button
						type="submit"
						className="w-full h-12 text-base group"
						disabled={!recipient || !amount}
					>
						Continue
						<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
					</Button>
				</form>

				{/* Info */}
				<p className="text-xs text-center text-muted-foreground">
					You'll verify this transaction with your EUDI Wallet in the next step
				</p>
			</div>
		</div>
	);
}
