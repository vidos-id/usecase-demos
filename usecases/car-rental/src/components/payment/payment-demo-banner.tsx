import { ShieldAlert } from "lucide-react";

/**
 * Banner that labels the payment stage as demo-only.
 * Renders at the top of the read-only card form to prevent confusion.
 */
export function PaymentDemoBanner() {
	return (
		<div
			className="mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3"
			style={{
				borderColor: "oklch(0.78 0.16 75 / 0.35)",
				background: "oklch(0.78 0.16 75 / 0.06)",
			}}
		>
			<ShieldAlert
				className="mt-0.5 size-4 shrink-0"
				style={{ color: "oklch(0.62 0.14 75)" }}
				aria-hidden="true"
			/>
			<div>
				<p
					className="font-heading text-xs font-bold uppercase tracking-widest"
					style={{ color: "oklch(0.52 0.14 75)" }}
				>
					Demo Payment Step
				</p>
				<p className="mt-0.5 text-xs text-muted-foreground">
					No real charge is processed. Card details are prefilled and
					non-editable for demo stability.
				</p>
			</div>
		</div>
	);
}
