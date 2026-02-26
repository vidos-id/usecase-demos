import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Header() {
	return (
		<header className="border-b bg-background sticky top-0 z-50">
			<div className="container-page flex h-14 items-center justify-between">
				<div className="flex items-center gap-6">
					<span className="text-lg font-bold tracking-tight">Vidos</span>
					<Separator orientation="vertical" className="h-5" />
					<span className="mono-label">EUDI Demos</span>
				</div>
				<nav className="hidden items-center gap-6 sm:flex">
					<a
						href="#use-cases"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						Use Cases
					</a>
					<a
						href="#how-it-works"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						How It Works
					</a>
					<Button size="sm" variant="outline">
						Documentation
					</Button>
				</nav>
			</div>
		</header>
	);
}
