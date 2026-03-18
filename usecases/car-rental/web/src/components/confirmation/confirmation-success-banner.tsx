import { CheckCircle2 } from "lucide-react";

type Props = {
	eligibilityStatement: string;
};

export function ConfirmationSuccessBanner({ eligibilityStatement }: Props) {
	return (
		<div
			className="mb-8 rounded-2xl border p-6"
			style={{
				borderColor: "oklch(0.52 0.16 145 / 0.4)",
				background: "oklch(0.52 0.16 145 / 0.05)",
			}}
		>
			<div className="flex items-start gap-4">
				<div
					className="flex size-10 shrink-0 items-center justify-center rounded-full"
					style={{ background: "oklch(0.52 0.16 145 / 0.12)" }}
				>
					<CheckCircle2
						className="size-5"
						style={{ color: "oklch(0.52 0.16 145)" }}
					/>
				</div>
				<div>
					<h1
						className="font-heading mb-1 text-xl font-bold"
						style={{ color: "oklch(0.38 0.16 145)" }}
					>
						Booking Confirmed
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{eligibilityStatement}
					</p>
				</div>
			</div>
		</div>
	);
}
