import type { VerificationLifecycleState } from "@/domain/verification/verification-schemas";

type Props = {
	lifecycle: VerificationLifecycleState;
};

const CONFIG: Record<
	VerificationLifecycleState,
	{ label: string; color: string; bg: string }
> = {
	created: {
		label: "Initialised",
		color: "oklch(0.42 0.1 220)",
		bg: "oklch(0.42 0.1 220 / 0.08)",
	},
	pending_wallet: {
		label: "Awaiting Wallet",
		color: "oklch(0.72 0.14 75)",
		bg: "oklch(0.72 0.14 75 / 0.10)",
	},
	processing: {
		label: "Processing",
		color: "oklch(0.55 0.15 160)",
		bg: "oklch(0.55 0.15 160 / 0.08)",
	},
	success: {
		label: "Policy Passed",
		color: "oklch(0.52 0.16 145)",
		bg: "oklch(0.52 0.16 145 / 0.08)",
	},
	rejected: {
		label: "Rejected",
		color: "oklch(0.58 0.24 27)",
		bg: "oklch(0.58 0.24 27 / 0.08)",
	},
	expired: {
		label: "Expired",
		color: "oklch(0.65 0.14 55)",
		bg: "oklch(0.65 0.14 55 / 0.08)",
	},
	error: {
		label: "Error",
		color: "oklch(0.58 0.24 27)",
		bg: "oklch(0.58 0.24 27 / 0.08)",
	},
};

export function VerificationLifecycleBadge({ lifecycle }: Props) {
	const cfg = CONFIG[lifecycle];

	return (
		<span
			className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
			style={{ color: cfg.color, background: cfg.bg }}
		>
			<span
				className="size-1.5 rounded-full"
				style={{ background: cfg.color }}
			/>
			{cfg.label}
		</span>
	);
}
