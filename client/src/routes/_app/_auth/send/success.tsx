import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const successSearchSchema = z.object({
	transactionId: z.string(),
	recipient: z.string(),
	amount: z.string(),
	reference: z.string().optional(),
	confirmedAt: z.string(),
});

export const Route = createFileRoute("/_app/_auth/send/success")({
	validateSearch: successSearchSchema,
	component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
	const search = Route.useSearch();
	const [copied, setCopied] = useState(false);

	const confirmedDate = new Date(search.confirmedAt);

	const copyTransactionId = () => {
		navigator.clipboard.writeText(search.transactionId);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto space-y-8">
				{/* Success header - full width */}
				<div className="text-center space-y-4 pt-8 animate-slide-up">
					<div className="inline-flex items-center justify-center h-20 w-20 lg:h-24 lg:w-24 rounded-full bg-green-500/10 mb-2">
						<CheckCircle2 className="h-10 w-10 lg:h-12 lg:w-12 text-green-500" />
					</div>
					<div>
						<h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
							Payment Confirmed
						</h1>
						<p className="text-muted-foreground mt-1 lg:text-lg">
							Your transaction has been verified and processed
						</p>
					</div>
				</div>

				{/* Amount display */}
				<div className="text-center py-4 lg:py-6">
					<p className="text-5xl lg:text-6xl font-bold font-mono tracking-tight">
						€{search.amount}
					</p>
					<p className="text-muted-foreground mt-2 lg:text-lg">
						sent to {search.recipient}
					</p>
				</div>

				{/* 2-col layout for details */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
					{/* Transaction details */}
					<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
						<div className="p-6 lg:p-8 space-y-4">
							<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
								Transaction Details
							</h2>

							<div className="space-y-3">
								<DetailRow label="Recipient" value={search.recipient} />
								<DetailRow label="Amount" value={`€${search.amount}`} mono />
								{search.reference && (
									<DetailRow label="Reference" value={search.reference} />
								)}
								<DetailRow
									label="Confirmed"
									value={confirmedDate.toLocaleDateString("en-GB", {
										day: "numeric",
										month: "short",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								/>

								{/* Transaction ID */}
								<div className="flex justify-between items-start pt-2 border-t border-border/40">
									<span className="text-sm text-muted-foreground">
										Transaction ID
									</span>
									<div className="flex items-center gap-2">
										<span className="text-xs font-mono text-muted-foreground max-w-[180px] lg:max-w-[200px] truncate">
											{search.transactionId}
										</span>
										<button
											type="button"
											onClick={copyTransactionId}
											className="p-1 rounded hover:bg-muted transition-colors"
											title="Copy ID"
										>
											{copied ? (
												<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
											) : (
												<Copy className="h-3.5 w-3.5 text-muted-foreground" />
											)}
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Info panel */}
					<div className="space-y-6">
						{/* Verification badge */}
						<div className="rounded-xl bg-primary/5 border border-primary/20 p-4 lg:p-6">
							<div className="flex items-center gap-3 lg:gap-4">
								<div className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
									<ExternalLink className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
								</div>
								<div>
									<p className="text-sm lg:text-base font-medium">
										Verified Identity
									</p>
									<p className="text-xs lg:text-sm text-muted-foreground">
										This payment was confirmed using your PID credential
									</p>
								</div>
							</div>
						</div>

						{/* Demo notice */}
						<div className="rounded-xl bg-primary/5 border border-primary/20 p-4 lg:p-6">
							<p className="text-sm text-primary">
								<span className="font-medium">Demo Mode:</span> Your balance and
								activity list have been updated to reflect this payment. No real
								funds were transferred.
							</p>
						</div>

						{/* Actions */}
						<div className="flex gap-3">
							<Button asChild variant="outline" className="flex-1 h-12">
								<Link to="/send">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Send Another
								</Link>
							</Button>
							<Button asChild className="flex-1 h-12">
								<Link to="/dashboard">Dashboard</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function DetailRow({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="flex justify-between items-center">
			<span className="text-sm text-muted-foreground">{label}</span>
			<span className={cn("font-medium", mono && "font-mono")}>{value}</span>
		</div>
	)
}
