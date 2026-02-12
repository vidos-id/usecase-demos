import { Link, useRouterState } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { getSessionId, subscribeSession } from "@/lib/auth";
import { AccountMenu } from "./account-menu";

export function Header() {
	const matches = useRouterState({ select: (state) => state.matches });
	const [isAuthenticated, setIsAuthenticated] = useState(!!getSessionId());
	const isAuthRoute = matches.some((match) =>
		match.routeId?.startsWith("/_auth"),
	);

	useEffect(() => {
		return subscribeSession(() => {
			setIsAuthenticated(!!getSessionId());
		});
	}, []);

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link
						to={isAuthenticated ? "/dashboard" : "/"}
						className="group flex items-center gap-3"
					>
						{/* Logo mark */}
						<div className="relative">
							<img
								src="/logo.svg"
								alt="VidosDemoBank"
								className="w-10 h-10 drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
							/>
							{/* Subtle glow on hover */}
							<div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
						</div>
						{/* Wordmark */}
						<div className="flex flex-col">
							<span className="text-lg font-semibold tracking-tight leading-none">
								VidosDemoBank
							</span>
							<span className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-widest">
								EUDI Demo
							</span>
						</div>
					</Link>

					{/* Right side */}
					<div className="flex items-center gap-4">
						{/* Trust badge - always visible */}
						<div className="hidden sm:flex items-center gap-1.5 text-muted-foreground/60">
							<Shield className="h-3.5 w-3.5" />
							<span className="text-[10px] font-mono uppercase tracking-wider">
								PID Verified
							</span>
						</div>

						{/* Divider */}
						<div className="hidden sm:block h-6 w-px bg-border/60" />

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
							<div className="flex items-center gap-3">
								<Link
									to="/signin"
									className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
								>
									Sign In
								</Link>
								<Link
									to="/signup"
									className="text-sm font-medium px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
								>
									Get Started
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
