import { IdCard, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BookingConfirmationPayload } from "@/domain/booking/booking-confirmation";

export type CredentialHighlights =
	BookingConfirmationPayload["credentialHighlights"];

type Props = {
	highlights: CredentialHighlights;
	title?: string;
	description?: string;
};

// ─── Portrait ────────────────────────────────────────────────────────────────

type PortraitProps = {
	portrait: string | null;
	fallbackLabel: string;
	fullName: string;
};

function PortraitDisplay({ portrait, fallbackLabel, fullName }: PortraitProps) {
	if (portrait) {
		return (
			<div className="flex flex-col items-center gap-2">
				<div
					className="overflow-hidden rounded-xl border-2"
					style={{ borderColor: "oklch(0.42 0.1 220 / 0.3)" }}
				>
					<img
						src={`data:image/jpeg;base64,${portrait}`}
						alt={`Portrait of ${fullName}`}
						className="size-24 object-cover"
					/>
				</div>
				<span className="text-xs text-muted-foreground">ID Portrait</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center gap-2">
			<div
				className="flex size-24 items-center justify-center rounded-xl border-2"
				style={{
					borderColor: "oklch(0.42 0.1 220 / 0.2)",
					background: "oklch(0.42 0.1 220 / 0.06)",
				}}
			>
				{fallbackLabel &&
				fallbackLabel.length <= 3 &&
				fallbackLabel !== "Portrait unavailable" ? (
					<span
						className="font-heading text-2xl font-bold"
						style={{ color: "oklch(0.42 0.1 220)" }}
					>
						{fallbackLabel}
					</span>
				) : (
					<User
						className="size-10 text-muted-foreground/30"
						aria-hidden="true"
					/>
				)}
			</div>
			<span className="text-xs text-muted-foreground">
				{fallbackLabel.length <= 3 && fallbackLabel !== "Portrait unavailable"
					? "Portrait not disclosed"
					: fallbackLabel}
			</span>
		</div>
	);
}

// ─── Highlight Field ─────────────────────────────────────────────────────────

function HighlightField({
	label,
	value,
	isFallback,
}: {
	label: string;
	value: string;
	isFallback: boolean;
}) {
	return (
		<div className="rounded-lg border border-border/40 bg-muted/20 p-3">
			<p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
			<p
				className={[
					"text-sm font-medium",
					isFallback ? "italic text-muted-foreground/60" : "",
				].join(" ")}
			>
				{value}
			</p>
		</div>
	);
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ConfirmationCredentialHighlights({
	highlights,
	title = "Disclosed Credential Attributes",
	description = "Attributes presented from wallet and accepted by authorizer policy result.",
}: Props) {
	const fullNameValue = highlights.fullName.value;

	return (
		<Card className="border-border/60">
			<CardContent className="p-5">
				<div className="mb-3 flex items-center gap-2">
					<IdCard className="size-4 text-muted-foreground" aria-hidden="true" />
					<h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
						{title}
					</h2>
				</div>
				<p className="mb-3 text-xs text-muted-foreground/60">{description}</p>
				<Separator className="mb-4 opacity-60" />

				<div className="flex flex-col gap-4 sm:flex-row">
					{/* Portrait column */}
					<div className="flex shrink-0 justify-center sm:justify-start">
						<PortraitDisplay
							portrait={highlights.portrait}
							fallbackLabel={highlights.portraitFallbackLabel}
							fullName={fullNameValue}
						/>
					</div>

					{/* Fields grid */}
					<div className="grid flex-1 gap-3 sm:grid-cols-2">
						<HighlightField
							label="Full Name"
							value={highlights.fullName.value}
							isFallback={highlights.fullName.isFallback}
						/>
						<HighlightField
							label="mDL Number"
							value={highlights.mdlNumber.value}
							isFallback={highlights.mdlNumber.isFallback}
						/>
						<HighlightField
							label="mDL Expiry"
							value={highlights.mdlExpiry.value}
							isFallback={highlights.mdlExpiry.isFallback}
						/>
						{highlights.drivingPrivileges ? (
							<HighlightField
								label="Driving Privileges"
								value={highlights.drivingPrivileges.value}
								isFallback={highlights.drivingPrivileges.isFallback}
							/>
						) : (
							<div className="rounded-lg border border-border/40 bg-muted/20 p-3">
								<p className="mb-0.5 text-xs text-muted-foreground">
									Driving Privileges
								</p>
								<p className="text-sm italic text-muted-foreground/50">
									Not disclosed
								</p>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
