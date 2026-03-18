import { ArrowRight, BookOpen, Wallet } from "lucide-react";

/**
 * CTA block linking to home app generic guidance pages.
 * Uses <a> anchors with full URLs from VITE_ env vars — no router Link,
 * because usecases-home is a separate deployed app.
 */
export function HomeGuidesCta() {
	const walletSetupUrl =
		import.meta.env.VITE_HOME_WALLET_SETUP_URL ?? "/wallet-setup";
	const howDemosWorkUrl =
		import.meta.env.VITE_HOME_HOW_DEMOS_WORK_URL ?? "/how-demos-work";

	return (
		<section className="border-b border-border/50 py-12 bg-background">
			<div className="mx-auto max-w-5xl px-4 sm:px-6">
				<p
					className="mb-6 font-mono text-[11px] font-semibold uppercase tracking-widest"
					style={{ color: "var(--primary)" }}
				>
					Before you start
				</p>
				<div className="grid gap-4 sm:grid-cols-2">
					<a
						href={walletSetupUrl}
						className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all duration-200"
					>
						<div
							className="flex size-10 shrink-0 items-center justify-center rounded-lg"
							style={{
								background: "var(--primary)10",
								color: "var(--primary)",
							}}
						>
							<Wallet className="size-5" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-sm">Need a wallet?</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								Install a compatible EUDI Wallet and load your test credentials
							</p>
						</div>
						<ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
					</a>

					<a
						href={howDemosWorkUrl}
						className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all duration-200"
					>
						<div
							className="flex size-10 shrink-0 items-center justify-center rounded-lg"
							style={{
								background: "var(--primary)10",
								color: "var(--primary)",
							}}
						>
							<BookOpen className="size-5" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-sm">How do the demos work?</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								Understand the verification flow before you try it
							</p>
						</div>
						<ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
					</a>
				</div>
			</div>
		</section>
	);
}
