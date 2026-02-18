import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useIsAuthenticated } from "@/lib/auth";
import { AccountMenu } from "./account-menu";

export function Header() {
	const matches = useRouterState({ select: (state) => state.matches });
	const isAuthenticated = useIsAuthenticated();
	const isAuthRoute = matches.some((match) =>
		match.routeId?.startsWith("/_auth"),
	);

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between gap-2">
					{/* Logo */}
					<Link
						to="/"
						className="group flex items-center gap-2 sm:gap-3 shrink-0"
					>
						{/* Logo mark */}
						<div className="relative">
							<img
								src="/logo.svg"
								alt="VidosDemoBank"
								className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
							/>
							{/* Subtle glow on hover */}
							<div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
						</div>
						{/* Wordmark - hidden on very narrow screens */}
						<div className="hidden min-[400px]:flex flex-col">
							<span className="text-base sm:text-lg font-semibold tracking-tight leading-none">
								VidosDemoBank
							</span>
							<span className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-widest">
								EUDI Demo
							</span>
						</div>
					</Link>

					{/* Right side */}
					<div className="flex items-center gap-2 sm:gap-4">
						{/* Guide link - subtle attention-grabber for new visitors */}
						<Link
							to="/guide"
							className="group relative flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300"
						>
							<BookOpen className="h-4 w-4 text-primary" />
							<span className="text-sm font-medium text-primary">Guide</span>

							{/* Gentle glowing dot indicator */}
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
							</span>
						</Link>

						{/* Trust badge - always visible */}
						<div className="hidden md:flex items-center gap-1.5 text-muted-foreground/60">
							<Shield className="h-3.5 w-3.5" />
							<span className="text-[10px] font-mono uppercase tracking-wider">
								PID Verified
							</span>
						</div>

						{/* Theme toggle */}
						<ThemeToggle />

						{/* Divider */}
						<div className="hidden md:block h-6 w-px bg-border/60" />

						{/* Auth controls */}
						{isAuthenticated && isAuthRoute ? (
							<AccountMenu />
						) : isAuthenticated ? (
							<Link
								to="/dashboard"
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
							>
								Dashboard
							</Link>
						) : (
							<div className="flex items-center gap-2 sm:gap-3">
								<Link
									to="/signin"
									className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 whitespace-nowrap"
								>
									Sign In
								</Link>
								<Link
									to="/signup"
									className="text-sm font-medium px-3 sm:px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 whitespace-nowrap"
								>
									<span className="hidden sm:inline">Create Account</span>
									<span className="sm:hidden">Sign Up</span>
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
