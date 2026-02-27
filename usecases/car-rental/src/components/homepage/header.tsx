import { Car } from "lucide-react";
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
				<div className="flex items-center gap-2">
					<div
						className="flex size-8 items-center justify-center rounded-lg"
						style={{ background: "var(--primary)" }}
					>
						<Car className="size-4" style={{ color: "var(--amber)" }} />
					</div>
					<span
						className="font-heading text-xl font-bold tracking-tight"
						style={{ color: "var(--color-foreground)" }}
					>
						VROOM
					</span>
				</div>

				{/* Nav */}
				<nav className="flex items-center gap-2">
					<Button variant="ghost" size="sm" className="text-sm">
						How it works
					</Button>
				</nav>
			</div>
		</header>
	);
}
