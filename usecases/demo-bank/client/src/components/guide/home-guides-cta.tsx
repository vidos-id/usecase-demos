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
		<section className="space-y-4">
			<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
				<BookOpen className="h-3.5 w-3.5 text-primary" />
				<span className="text-xs font-medium text-primary">
					New to EUDI Wallet demos?
				</span>
			</div>

			<div className="grid sm:grid-cols-2 gap-4">
				<a
					href={walletSetupUrl}
					className="group flex items-center gap-4 p-5 rounded-2xl border border-border/60 bg-background hover:border-primary/40 transition-all duration-200"
				>
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
						<Wallet className="h-5 w-5" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="font-semibold text-sm">Wallet Setup Guide</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							Install an EUDI Wallet and load your PID credential
						</p>
					</div>
					<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
				</a>

				<a
					href={howDemosWorkUrl}
					className="group flex items-center gap-4 p-5 rounded-2xl border border-border/60 bg-background hover:border-primary/40 transition-all duration-200"
				>
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
						<BookOpen className="h-5 w-5" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="font-semibold text-sm">How Demos Work</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							Understand the verification flow end-to-end
						</p>
					</div>
					<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
				</a>
			</div>
		</section>
	);
}
