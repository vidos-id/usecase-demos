import { Link } from "@tanstack/react-router";
import { getSessionId } from "@/lib/auth";
import { AccountMenu } from "./account-menu";

export function Header() {
	const isAuthenticated = !!getSessionId();

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-14 items-center justify-between">
					{/* Logo */}
					<Link to="/" className="flex items-center gap-2">
						<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
							<span className="text-primary-foreground font-bold text-sm">
								DB
							</span>
						</div>
						<span className="text-xl font-semibold hidden sm:inline">
							DemoBank
						</span>
					</Link>

					{/* Right side */}
					<div className="flex items-center gap-4">
						{isAuthenticated ? (
							<AccountMenu />
						) : (
							<div className="flex items-center gap-2">
								<Link
									to="/signin"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									Sign In
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
