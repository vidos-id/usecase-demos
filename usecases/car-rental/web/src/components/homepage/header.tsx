import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header({ className }: { className?: string }) {
	return (
		<header
			className={cn(
				"glass sticky top-0 z-50 border-b border-border/50 bg-background/80",
				className,
			)}
		>
			<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
				{/* Logo */}
				<Link to="/">
					<img
						src="/car-rental/vidos-drive-logo.svg"
						alt="VidosDrive"
						className="h-8"
					/>
				</Link>

				{/* Nav */}
				<nav className="flex items-center gap-2">
					<Button variant="ghost" size="sm" className="text-sm" asChild>
						<Link to="/how-it-works">How it works</Link>
					</Button>
				</nav>
			</div>
		</header>
	);
}
