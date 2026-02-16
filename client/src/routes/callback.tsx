import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowRight,
	CheckCircle2,
	Clock,
	CreditCard,
	Loader2,
	LogIn,
	RefreshCw,
	ShieldX,
	UserPlus,
	Wallet,
	XCircle,
} from "lucide-react";
import { useEffect } from "react";
import type { CallbackResolveResponse } from "shared/api/callback";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const callbackSearchSchema = z.object({
	response_code: z.string().optional(),
});

export const Route = createFileRoute("/callback")({
	validateSearch: callbackSearchSchema,
	component: CallbackPage,
});

// Flow type display configuration
const flowConfig: Record<
	CallbackResolveResponse["flowType"],
	{ label: string; icon: typeof LogIn; description: string }
> = {
	signin: {
		label: "Sign In",
		icon: LogIn,
		description: "Identity verification for account access",
	},
	signup: {
		label: "Sign Up",
		icon: UserPlus,
		description: "Identity verification for account creation",
	},
	payment: {
		label: "Payment Authorization",
		icon: CreditCard,
		description: "Identity verification for payment confirmation",
	},
	loan: {
		label: "Loan Application",
		icon: Wallet,
		description: "Identity verification for loan processing",
	},
	profile_update: {
		label: "Profile Update",
		icon: RefreshCw,
		description: "Identity verification for profile changes",
	},
};

function CallbackPage() {
	const { response_code } = Route.useSearch();
	const { apiClient } = useRouteContext({ from: "__root__" });

	const resolveMutation = useMutation({
		mutationFn: async (code: string) => {
			const res = await apiClient.api.callback.resolve.$post({
				json: { response_code: code },
			});

			if (!res.ok) {
				if (res.status === 404) {
					throw new Error("invalid_code");
				}
				throw new Error("resolve_failed");
			}

			return res.json();
		},
	});

	// Automatically resolve on mount if response_code is present
	useEffect(() => {
		if (response_code && !resolveMutation.data && !resolveMutation.isPending) {
			resolveMutation.mutate(response_code);
		}
	}, [response_code, resolveMutation]);

	// No response_code provided
	if (!response_code) {
		return <InvalidCodeState />;
	}

	// Loading state
	if (resolveMutation.isPending) {
		return <LoadingState />;
	}

	// Error state
	if (resolveMutation.isError) {
		const isInvalidCode = resolveMutation.error?.message === "invalid_code";
		if (isInvalidCode) {
			return <InvalidCodeState />;
		}
		return <ErrorState onRetry={() => resolveMutation.mutate(response_code)} />;
	}

	// Success - show result
	if (resolveMutation.data) {
		return <ResultDisplay result={resolveMutation.data} />;
	}

	return null;
}

function LoadingState() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="text-center space-y-4 animate-fade-in">
				<div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
					<Loader2 className="h-8 w-8 text-primary animate-spin" />
				</div>
				<div>
					<h1 className="text-xl font-semibold">Resolving Verification</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Please wait while we process your verification result...
					</p>
				</div>
			</div>
		</div>
	);
}

function InvalidCodeState() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="max-w-md w-full text-center space-y-6 animate-slide-up">
				<div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-amber-500/10">
					<AlertCircle className="h-10 w-10 text-amber-500" />
				</div>
				<div className="space-y-2">
					<h1 className="text-2xl font-bold tracking-tight">
						Invalid or Expired Code
					</h1>
					<p className="text-muted-foreground">
						This verification code is no longer valid. It may have already been
						used or has expired.
					</p>
				</div>
				<div className="rounded-xl bg-muted/50 border border-border p-4">
					<p className="text-sm text-muted-foreground">
						Response codes are single-use and expire shortly after generation.
						Please check your other device for the verification result.
					</p>
				</div>
			</div>
		</div>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="max-w-md w-full text-center space-y-6 animate-slide-up">
				<div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-destructive/10">
					<XCircle className="h-10 w-10 text-destructive" />
				</div>
				<div className="space-y-2">
					<h1 className="text-2xl font-bold tracking-tight">
						Something Went Wrong
					</h1>
					<p className="text-muted-foreground">
						We couldn't resolve your verification result. Please try again.
					</p>
				</div>
				<Button onClick={onRetry} className="h-12 px-8">
					Try Again
				</Button>
			</div>
		</div>
	);
}

function ResultDisplay({ result }: { result: CallbackResolveResponse }) {
	const flow = flowConfig[result.flowType];
	const FlowIcon = flow.icon;

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
			<div className="max-w-lg w-full space-y-8 animate-slide-up">
				{/* Status header */}
				<div className="text-center space-y-4">
					<StatusIcon status={result.status} />
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							<StatusTitle status={result.status} flowType={result.flowType} />
						</h1>
						<p className="text-muted-foreground mt-1">
							<StatusDescription
								status={result.status}
								vidosStatus={result.vidosStatus}
							/>
						</p>
					</div>
				</div>

				{/* Flow info card */}
				<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
					<div className="p-6 space-y-4">
						{/* Flow type */}
						<div className="flex items-center gap-4">
							<div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
								<FlowIcon className="h-6 w-6 text-primary" />
							</div>
							<div>
								<p className="font-medium">{flow.label}</p>
								<p className="text-sm text-muted-foreground">
									{flow.description}
								</p>
							</div>
						</div>

						{/* Timestamp */}
						{result.completedAt && (
							<div className="pt-4 border-t border-border/40">
								<DetailRow
									label="Completed"
									value={new Date(result.completedAt).toLocaleDateString(
										"en-GB",
										{
											day: "numeric",
											month: "short",
											year: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										},
									)}
								/>
							</div>
						)}

						{/* Transaction details */}
						{result.transactionDetails && (
							<TransactionDetails details={result.transactionDetails} />
						)}
					</div>
				</div>

				{/* Error info */}
				{result.status === "failed" && result.errorInfo && (
					<div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
						<div className="flex items-start gap-3">
							<ShieldX className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
							<div>
								<p className="font-medium text-destructive">
									{result.errorInfo.title}
								</p>
								{result.errorInfo.detail && (
									<p className="text-sm text-destructive/80 mt-1">
										{result.errorInfo.detail}
									</p>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Pending info */}
				{result.status === "pending" && (
					<div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
						<div className="flex items-start gap-3">
							<Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
							<div>
								<p className="font-medium text-amber-700 dark:text-amber-400">
									Processing in Progress
								</p>
								<p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
									The verification was received
									{result.vidosStatus === "authorized" &&
										" and authorized by Vidos"}
									, but the application is still processing. Check your other
									device for the final result.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Demo notice */}
				<div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
					<p className="text-sm text-primary">
						<span className="font-medium">Wallet Callback:</span> This page is
						shown on the device that scanned the QR code. The main application
						on your other device has the full context of this verification.
					</p>
				</div>

				{/* Action */}
				<Button asChild className="w-full h-12" variant="outline">
					<Link to="/">
						Go to Demo Bank
						<ArrowRight className="ml-2 h-4 w-4" />
					</Link>
				</Button>
			</div>
		</div>
	);
}

function StatusIcon({ status }: { status: CallbackResolveResponse["status"] }) {
	if (status === "completed") {
		return (
			<div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10">
				<CheckCircle2 className="h-10 w-10 text-green-500" />
			</div>
		);
	}
	if (status === "failed") {
		return (
			<div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-destructive/10">
				<XCircle className="h-10 w-10 text-destructive" />
			</div>
		);
	}
	// pending
	return (
		<div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-amber-500/10">
			<Clock className="h-10 w-10 text-amber-500" />
		</div>
	);
}

function StatusTitle({
	status,
	flowType,
}: {
	status: CallbackResolveResponse["status"];
	flowType: CallbackResolveResponse["flowType"];
}) {
	const flow = flowConfig[flowType];
	if (status === "completed") {
		return `${flow.label} Successful`;
	}
	if (status === "failed") {
		return `${flow.label} Failed`;
	}
	return `${flow.label} Processing`;
}

function StatusDescription({
	status,
	vidosStatus,
}: {
	status: CallbackResolveResponse["status"];
	vidosStatus?: CallbackResolveResponse["vidosStatus"];
}) {
	if (status === "completed") {
		return "Your identity verification completed successfully.";
	}
	if (status === "failed") {
		return "The verification could not be completed.";
	}
	// pending
	if (vidosStatus === "authorized") {
		return "Identity verified, application processing...";
	}
	if (vidosStatus === "rejected") {
		return "Verification was rejected, waiting for application...";
	}
	return "Waiting for the application to process...";
}

function TransactionDetails({
	details,
}: {
	details: NonNullable<CallbackResolveResponse["transactionDetails"]>;
}) {
	return (
		<div className="pt-4 border-t border-border/40 space-y-3">
			<p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
				Transaction Details
			</p>

			{details.type === "payment" ? (
				<>
					<DetailRow label="Recipient" value={details.recipient} />
					<DetailRow label="Amount" value={`€${details.amount}`} mono />
					{details.reference && (
						<DetailRow label="Reference" value={details.reference} />
					)}
				</>
			) : (
				<>
					<DetailRow
						label="Loan Amount"
						value={`€${details.loanAmount}`}
						mono
					/>
					<DetailRow label="Purpose" value={details.loanPurpose} />
					<DetailRow label="Term" value={`${details.loanTerm} months`} />
				</>
			)}
		</div>
	);
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
	);
}
