import { getAgeMethodTechnicalDetails } from "@/domain/verification/age-verification-method-details";
import type { AgeVerificationMethod } from "@/domain/verification/verification-types";
import { cn } from "@/lib/utils";

const ageMethodOptions: {
	value: AgeVerificationMethod;
	label: string;
	subtitle: string;
}[] = [
	{
		value: "age_equal_or_over",
		label: "Privacy-First",
		subtitle: "Share only a yes/no confirmation — no personal data disclosed",
	},
	{
		value: "age_in_years",
		label: "Age Only",
		subtitle: "Share your age in years — no birth date disclosed",
	},
	{
		value: "birthdate",
		label: "Full Birth Date",
		subtitle: "Share your complete birth date for maximum compatibility",
	},
];

export function AgeMethodSelector({
	value,
	requiredAge,
	onChange,
}: {
	value: AgeVerificationMethod | null;
	requiredAge: number | null;
	onChange: (method: AgeVerificationMethod) => void;
}) {
	const resolvedAge = requiredAge ?? 18;

	return (
		<div className="mb-6">
			<h2 className="font-heading mb-3 text-base font-bold">
				Age Verification Method
			</h2>
			<p className="mb-4 text-xs text-muted-foreground">
				Choose what age information to share from your PID credential.
				{requiredAge !== null
					? ` Destination requires ${requiredAge}+.`
					: " Select a destination to see the exact age threshold."}
			</p>
			<div className="grid gap-3">
				{ageMethodOptions.map((option) => {
					const selected = value === option.value;
					const technical = getAgeMethodTechnicalDetails(
						option.value,
						resolvedAge,
					);
					return (
						<button
							key={option.value}
							type="button"
							onClick={() => onChange(option.value)}
							className={cn(
								"w-full rounded-xl border text-left transition-all duration-200",
								selected
									? "border-[var(--primary)] shadow-sm"
									: "border-border/60 bg-card hover:border-border",
							)}
							style={
								selected
									? {
											borderLeftWidth: "4px",
											background: "oklch(0.4 0.12 15 / 0.04)",
										}
									: { borderLeftWidth: "4px", borderLeftColor: "transparent" }
							}
						>
							<div className="flex items-start gap-3 p-4">
								<div
									className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
									style={
										selected
											? {
													borderColor: "var(--primary)",
													background: "var(--primary)",
												}
											: { borderColor: "var(--border)" }
									}
								>
									{selected && (
										<div className="size-1.5 rounded-full bg-white" />
									)}
								</div>

								<div className="min-w-0 flex-1">
									<p className="font-heading text-sm font-bold">
										{option.label}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										{option.subtitle}
									</p>
									<div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
										<p>
											PID field: <code>{technical.pidField}</code>
										</p>
										<p>
											Claim path: <code>{technical.claimPath}</code>
										</p>
										<p>
											Expected value ({technical.valueShape}):{" "}
											<code>{technical.exampleAcceptedValue}</code>
										</p>
										<p>Accepted when: {technical.acceptanceRule}</p>
									</div>
								</div>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
