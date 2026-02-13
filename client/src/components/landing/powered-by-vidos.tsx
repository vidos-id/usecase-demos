import { BookOpen, Fingerprint, Shield, Zap } from "lucide-react";
import { ResourceLink } from "./resource-link";

/**
 * Footer section showing Vidos branding and useful resource links.
 */
export function PoweredByVidos() {
	return (
		<section className="py-10 border-t border-border/40 bg-muted/10">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center gap-6">
					{/* Powered by Vidos - Prominent */}
					<a
						href="https://vidos.id"
						target="_blank"
						rel="noopener noreferrer"
						className="group flex flex-col items-center gap-2 hover:opacity-90 transition-opacity"
					>
						<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
							Verification infrastructure by
						</span>
						<img
							src={"/usecase-demos/vidos-logo.svg"}
							alt="Vidos"
							className="h-8 dark:invert"
						/>
					</a>

					{/* Resource Links */}
					<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm pt-4 border-t border-border/30 w-full max-w-xl">
						<ResourceLink
							href="https://vidos.id/docs"
							icon={<BookOpen className="h-3.5 w-3.5" />}
							label="Vidos Docs"
						/>
						<ResourceLink
							href="https://authorizer.demo.vidos.id"
							icon={<Zap className="h-3.5 w-3.5" />}
							label="Authorizer Tester"
						/>
						<ResourceLink
							href="https://eudi.dev/latest/"
							icon={<Shield className="h-3.5 w-3.5" />}
							label="EUDI ARF"
						/>
						<ResourceLink
							href="https://eudi.dev/latest/annexes/annex-3/annex-3.01-pid-rulebook/"
							icon={<Fingerprint className="h-3.5 w-3.5" />}
							label="PID Rulebook"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
