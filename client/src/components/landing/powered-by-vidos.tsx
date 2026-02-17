import { BookOpen, Fingerprint, Github, Shield, Zap } from "lucide-react";
import { ResourceLink } from "./resource-link";

/**
 * Credibility band showing Vidos branding and resource links.
 * Designed as a transitional element between hero and features.
 */
export function PoweredByVidos() {
	return (
		<section className="relative py-8 overflow-hidden">
			{/* Subtle gradient backdrop */}
			<div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.03] to-transparent" />
			<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
			<div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

			<div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Single row: resources — logo — resources */}
				<div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
					{/* Left resources */}
					<div className="flex items-center gap-5 order-2 lg:order-1">
						<ResourceLink
							href="https://vidos.id/docs"
							icon={<BookOpen className="h-3.5 w-3.5" />}
							label="Docs"
						/>
						<ResourceLink
							href="https://authorizer.demo.vidos.id"
							icon={<Zap className="h-3.5 w-3.5" />}
							label="Tester"
						/>
						<ResourceLink
							href="https://github.com/vidos-id/usecase-demos"
							icon={<Github className="h-3.5 w-3.5" />}
							label="Source"
						/>
					</div>

					{/* Center: Vidos branding — the focal point */}
					<a
						href="https://vidos.id"
						target="_blank"
						rel="noopener noreferrer"
						className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 order-1 lg:order-2"
					>
						<span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
							Powered by
						</span>
						<div className="h-4 w-px bg-border/50" />
						<img
							src={"/usecase-demos/vidos-logo.svg"}
							alt="Vidos"
							className="h-5 dark:invert transition-transform duration-300 group-hover:scale-105"
						/>
					</a>

					{/* Right resources */}
					<div className="flex items-center gap-5 order-3">
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
