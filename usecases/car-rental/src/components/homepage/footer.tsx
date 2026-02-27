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
					<img src="/vidos-drive-logo.svg" alt="VidosDrive" className="h-7" />

					<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
						Demo powered by{" "}
						<a
							href="https://vidos.id/"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center hover:opacity-80"
						>
							<img src="/vidos-logo.svg" alt="Vidos" className="h-5" />
						</a>
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
