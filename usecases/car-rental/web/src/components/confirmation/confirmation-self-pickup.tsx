import { KeyRound, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BookingConfirmationPayload } from "@/domain/booking/booking-confirmation";

type Props = {
	pickup: BookingConfirmationPayload["pickup"];
};

export function ConfirmationSelfPickup({ pickup }: Props) {
	return (
		<Card className="border-border/60">
			<CardContent className="p-5">
				<div className="mb-3 flex items-center gap-2">
					<KeyRound
						className="size-4 text-muted-foreground"
						aria-hidden="true"
					/>
					<h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
						Self Pickup
					</h2>
				</div>
				<Separator className="mb-4 opacity-60" />

				{/* Locker credentials — prominently displayed */}
				<div
					className="mb-4 grid grid-cols-2 gap-3 rounded-xl border p-4"
					style={{
						borderColor: "oklch(0.42 0.1 220 / 0.3)",
						background: "oklch(0.42 0.1 220 / 0.04)",
					}}
				>
					<div>
						<p
							className="mb-1 text-[10px] font-bold uppercase tracking-widest"
							style={{ color: "oklch(0.42 0.1 220 / 0.7)" }}
						>
							Locker ID
						</p>
						<p
							className="font-mono text-lg font-bold"
							style={{ color: "var(--primary)" }}
						>
							{pickup.locker.lockerId}
						</p>
					</div>
					<div className="border-l border-border/50 pl-3">
						<p
							className="mb-1 text-[10px] font-bold uppercase tracking-widest"
							style={{ color: "oklch(0.42 0.1 220 / 0.7)" }}
						>
							Locker PIN
						</p>
						<p
							className="font-mono text-lg font-bold tracking-[0.25em]"
							style={{ color: "var(--primary)" }}
						>
							{pickup.locker.lockerPin}
						</p>
					</div>
				</div>

				{/* Location and guidance */}
				<div className="flex items-start gap-2 mb-3">
					<MapPin
						className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
					<p className="text-sm font-medium">{pickup.locationName}</p>
				</div>
				<ol className="space-y-1.5 pl-1">
					{pickup.guidance.map((line, idx) => (
						<li
							key={line}
							className="flex items-start gap-2.5 text-xs text-muted-foreground"
						>
							<span
								className="flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
								style={{
									background: "oklch(0.42 0.1 220 / 0.1)",
									color: "oklch(0.42 0.1 220)",
								}}
							>
								{idx + 1}
							</span>
							{line}
						</li>
					))}
				</ol>
			</CardContent>
		</Card>
	);
}
