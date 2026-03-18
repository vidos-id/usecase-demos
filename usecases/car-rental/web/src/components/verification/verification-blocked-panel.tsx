import { AlertCircle, AlertTriangle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VerificationLifecycleState } from "@/domain/verification/verification-schemas";

type Props = {
	lifecycle: VerificationLifecycleState;
	lastError: string | null;
	onRetry: () => void;
	onReset: () => void;
};

type BlockConfig = {
	icon: React.ReactNode;
	title: string;
	description: string;
	borderColor: string;
	bg: string;
	iconColor: string;
	retryLabel: string;
};

const BLOCK_CONFIG: Partial<Record<VerificationLifecycleState, BlockConfig>> = {
	rejected: {
		icon: <XCircle className="size-5" />,
		title: "Policy Rejected",
		description:
			"Presented credentials did not satisfy the rental authorizer policy. Check that your driving licence is valid and not expired, then try again.",
		borderColor: "oklch(0.58 0.24 27 / 0.35)",
		bg: "oklch(0.58 0.24 27 / 0.05)",
		iconColor: "oklch(0.58 0.24 27)",
		retryLabel: "Try Again",
	},
	expired: {
		icon: <Clock className="size-5" />,
		title: "Verification Expired",
		description:
			"The verification session timed out before a response was received. Please restart the verification flow.",
		borderColor: "oklch(0.65 0.14 55 / 0.4)",
		bg: "oklch(0.65 0.14 55 / 0.05)",
		iconColor: "oklch(0.65 0.14 55)",
		retryLabel: "Restart",
	},
	error: {
		icon: <AlertTriangle className="size-5" />,
		title: "Verification Error",
		description:
			"An unexpected error occurred during verification. You can retry or start a new booking session.",
		borderColor: "oklch(0.58 0.24 27 / 0.3)",
		bg: "oklch(0.58 0.24 27 / 0.04)",
		iconColor: "oklch(0.58 0.24 27)",
		retryLabel: "Retry",
	},
};

export function VerificationBlockedPanel({
	lifecycle,
	lastError,
	onRetry,
	onReset,
}: Props) {
	const config = BLOCK_CONFIG[lifecycle];
	if (!config) return null;

	return (
		<Card
			className="mb-5 border"
			style={{ borderColor: config.borderColor, background: config.bg }}
		>
			<CardContent className="p-5">
				<div className="mb-3 flex items-start gap-3">
					<span className="mt-0.5 shrink-0" style={{ color: config.iconColor }}>
						{config.icon}
					</span>
					<div>
						<h3
							className="font-heading mb-1 font-bold"
							style={{ color: config.iconColor }}
						>
							{config.title}
						</h3>
						<p className="text-sm text-muted-foreground">
							{config.description}
						</p>
						{lastError && (
							<p className="font-mono mt-2 rounded bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
								{lastError}
							</p>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						size="sm"
						className="rounded-lg font-semibold"
						style={{
							background: config.iconColor,
							color: "oklch(0.99 0 0)",
						}}
						onClick={onRetry}
					>
						{config.retryLabel}
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="rounded-lg text-sm"
						onClick={onReset}
					>
						Start Over
					</Button>
				</div>

				<div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/60">
					<AlertCircle className="size-3" />
					<span>Payment is locked until your driving licence is verified.</span>
				</div>
			</CardContent>
		</Card>
	);
}
