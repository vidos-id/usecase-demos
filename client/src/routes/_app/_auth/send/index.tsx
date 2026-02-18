import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageHero } from "@/components/layout/page-hero";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/_auth/send/")({
	component: SendMoneyPage,
});

const TEMPLATES = [
	{ recipient: "Landlord - Rent", amount: 1200.0, label: "Rent" },
	{ recipient: "Electric Company", amount: 85.0, label: "Utilities" },
	{ recipient: "Insurance Co.", amount: 150.0, label: "Insurance" },
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
		})
	}

	const selectTemplate = (t: (typeof TEMPLATES)[0]) => {
		setRecipient(t.recipient);
		setAmount(t.amount.toString());
	}

	return (
		<div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto space-y-8">
				<PageHeader />

				<PageHero
					icon={<Send className="h-6 w-6 lg:h-7 lg:w-7 text-primary" />}
					title="Send Money"
					description="Transfer funds securely with wallet verification"
				/>

				<TwoColumnLayout
					mobileRightFirst
					left={
						<div className="space-y-6">
							{/* Quick templates */}
							<div className="rounded-2xl border border-border/60 bg-background p-6 lg:p-8 space-y-4">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Sparkles className="h-4 w-4" />
									<span className="font-medium">Recent Payees</span>
								</div>
								<div className="space-y-2">
									{TEMPLATES.map((t) => (
										<button
											key={t.recipient}
											type="button"
											onClick={() => selectTemplate(t)}
											className={cn(
												"w-full flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background",
												"hover:border-primary/50 hover:bg-primary/5 transition-colors duration-200",
												recipient === t.recipient &&
													"border-primary bg-primary/5",
											)}
										>
											<div className="text-left">
												<p className="text-sm font-medium">{t.recipient}</p>
												<p className="text-xs text-muted-foreground">
													{t.label}
												</p>
											</div>
											<span className="text-sm font-mono text-muted-foreground">
												€{t.amount.toFixed(2)}
											</span>
										</button>
									))}
								</div>
							</div>

							{/* Info - desktop only */}
							<div className="hidden lg:block rounded-xl bg-primary/5 border border-primary/20 p-6">
								<p className="text-sm text-muted-foreground">
									You'll verify this transaction with your PID credential in the
									next step. No passwords are transmitted.
								</p>
							</div>
						</div>
					}
					right={
						<div className="rounded-2xl border border-border/60 bg-background p-6 lg:p-8">
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

								{/* Info - mobile only */}
								<p className="text-xs text-center text-muted-foreground lg:hidden">
									You'll verify this transaction with your PID credential in the
									next step
								</p>
							</form>
						</div>
					}
				/>
			</div>
		</div>
	)
}
