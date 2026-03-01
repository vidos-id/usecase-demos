import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import eudiLogo from "../assets/logo-eu-digital-indentity-wallet.svg";

export function Header() {
	return (
		<header className="sticky top-0 z-50">
			{/* Thin EU-blue top stripe — institutional marker */}
			<div className="h-1 bg-eu-blue" />

			<div className="border-b bg-background/95 backdrop-blur-sm">
				<div className="container-page flex h-16 items-center justify-between">
					<div className="flex items-center gap-4">
						<Link to="/">
							<img src="/vidos-logo.svg" alt="Vidos" className="h-7 w-auto" />
						</Link>
						<div className="h-6 w-px bg-border" />
						<img
							src={eudiLogo}
							alt="EU Digital Identity Wallet"
							className="h-8 w-auto"
						/>
					</div>

					<nav className="hidden items-center gap-8 md:flex">
						<a
							href="/#use-cases"
							className="text-sm text-muted-foreground transition-colors hover:text-eu-blue"
						>
							Use Cases
						</a>
						<Link
							to="/wallet-setup"
							className="text-sm text-muted-foreground transition-colors hover:text-eu-blue"
						>
							Wallet Setup
						</Link>
						<Link
							to="/how-demos-work"
							className="text-sm text-muted-foreground transition-colors hover:text-eu-blue"
						>
							How It Works
						</Link>
						<a
							href="https://vidos.id/docs/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-muted-foreground transition-colors hover:text-eu-blue"
						>
							Documentation
						</a>
					</nav>

					<Button
						variant="ghost"
						size="icon-sm"
						className="md:hidden"
						aria-label="Menu"
					>
						<Menu className="size-5" />
					</Button>
				</div>
			</div>
		</header>
	);
}
