import { Car } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
	return (
		<footer
			className="border-t border-border/50"
			style={{ background: "var(--surface)" }}
		>
			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
				{/* Brand row */}
				<div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
					<div className="flex items-center gap-2">
						<div
							className="flex size-7 items-center justify-center rounded-lg"
							style={{ background: "var(--primary)" }}
						>
							<Car className="size-3.5" style={{ color: "var(--amber)" }} />
						</div>
						<span className="font-heading text-lg font-bold tracking-tight">
							VROOM
						</span>
					</div>

					<p className="text-sm text-muted-foreground">
						Demo powered by{" "}
						<span className="font-semibold" style={{ color: "var(--primary)" }}>
							Vidos
						</span>
					</p>
				</div>

				<Separator className="my-6 opacity-50" />

				{/* Disclaimer */}
				<p className="text-center text-xs leading-relaxed text-muted-foreground">
					This is a demonstration application. No real bookings or payments are
					processed.
					<br className="hidden sm:block" /> All data shown is fictional and for
					illustrative purposes only.
				</p>
			</div>
		</footer>
	);
}
