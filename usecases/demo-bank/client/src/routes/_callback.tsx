import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_callback")({
	component: CallbackLayout,
});

function CallbackLayout() {
	return (
		<div className="min-h-screen flex flex-col bg-background">
			{/* Minimal header — logo only, links to welcome screen */}
			<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center">
						<Link to="/" className="group flex items-center gap-2 sm:gap-3">
							<div className="relative">
								<img
									src="/logo.svg"
									alt="VidosDemoBank"
									className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
								/>
								<div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							</div>
							<div className="hidden min-[400px]:flex flex-col">
								<span className="text-base sm:text-lg font-semibold tracking-tight leading-none">
									VidosDemoBank
								</span>
								<span className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-widest">
									EUDI Demo
								</span>
							</div>
						</Link>
					</div>
				</div>
			</header>

			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}
