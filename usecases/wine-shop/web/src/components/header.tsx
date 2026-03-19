import { Link } from "@tanstack/react-router";
import { Info, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrderStore } from "@/domain/order/order-store";

interface HeaderProps {
	children?: React.ReactNode;
	showNav?: boolean;
}

export function Header({ children, showNav = false }: HeaderProps) {
	const { cartItemCount } = useOrderStore();

	return (
		<header
			className="glass sticky top-0 z-50 border-b border-border/50 bg-background/85"
			style={{ backdropFilter: "blur(12px)" }}
		>
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
				{/* Brand */}
				<Link to="/" className="flex items-center">
					<img
						src="/wine-shop/vinos-logo.svg"
						alt="Vinos"
						className="h-18 py-2 w-auto"
					/>
				</Link>

				{/* Nav */}
				{showNav && (
					<nav className="hidden items-center gap-6 sm:flex">
						<Link
							to="/how-it-works"
							className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							<Info className="size-3.5" />
							How it works
						</Link>
					</nav>
				)}

				{/* Right side content */}
				{children || (
					<Link to="/cart" className="relative">
						<Button
							variant="outline"
							size="sm"
							className="gap-2 rounded-xl border-border/60"
						>
							<ShoppingCart className="size-4" />
							<span className="hidden sm:inline">Cart</span>
						</Button>
						{cartItemCount > 0 && (
							<span
								key={cartItemCount}
								className="badge-pop absolute -top-1.5 -right-1.5 flex min-w-[1.25rem] items-center justify-center rounded-full px-1 py-0.5 text-[10px] font-bold leading-none shadow-sm"
								style={{
									background: "var(--gold)",
									color: "var(--gold-foreground)",
								}}
							>
								{cartItemCount}
							</span>
						)}
					</Link>
				)}
			</div>
		</header>
	);
}
