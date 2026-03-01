import { createFileRoute, Link } from "@tanstack/react-router";
import {
	GlassWater,
	Info,
	MapPin,
	Minus,
	Plus,
	ShoppingCart,
	Sparkles,
	Wine,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { wines } from "@/data/wines";
import type { WineProduct, WineType } from "@/domain/catalog/catalog-types";
import { useOrderStore } from "@/domain/order/order-store";

export const Route = createFileRoute("/")({
	component: HomePage,
});

// ─── Wine type colors ───────────────────────────────────────────────────────────

const wineTypeConfig: Record<
	WineType,
	{ label: string; bg: string; color: string }
> = {
	red: {
		label: "Red",
		bg: "oklch(0.4 0.12 15 / 0.12)",
		color: "var(--primary)",
	},
	white: {
		label: "White",
		bg: "oklch(0.75 0.12 85 / 0.18)",
		color: "oklch(0.55 0.1 85)",
	},
	rose: {
		label: "Rosé",
		bg: "oklch(0.75 0.1 350 / 0.15)",
		color: "oklch(0.55 0.12 350)",
	},
	sparkling: {
		label: "Sparkling",
		bg: "oklch(0.75 0.12 85 / 0.12)",
		color: "oklch(0.5 0.08 85)",
	},
};

// ─── Wine card ──────────────────────────────────────────────────────────────────

function QuantityControl({
	quantity,
	onDecrement,
	onIncrement,
}: {
	quantity: number;
	onDecrement: () => void;
	onIncrement: () => void;
}) {
	return (
		<div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2 py-1">
			<button
				type="button"
				onClick={onDecrement}
				className="flex size-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
			>
				<Minus className="size-3.5" />
			</button>
			<span className="w-6 text-center text-sm font-semibold">{quantity}</span>
			<button
				type="button"
				onClick={onIncrement}
				className="flex size-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
			>
				<Plus className="size-3.5" />
			</button>
		</div>
	);
}

function WineCard({
	wine,
	onOpenDetails,
}: {
	wine: WineProduct;
	onOpenDetails: (wine: WineProduct) => void;
}) {
	const { state, addToCart, updateQuantity } = useOrderStore();
	const typeConf = wineTypeConfig[wine.type];
	const cartItem = state.items.find((item) => item.product.id === wine.id);
	const quantity = cartItem?.quantity ?? 0;

	return (
		<Card className="group overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
			<CardContent className="p-0">
				<button
					type="button"
					onClick={() => onOpenDetails(wine)}
					className="w-full text-left"
				>
					<div
						className="relative flex h-52 items-center justify-center overflow-hidden"
						style={{ background: "white" }}
					>
						<img
							src={wine.image}
							alt={wine.name}
							className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
						/>
						<div className="absolute top-3 left-3">
							<span
								className="rounded-full px-2.5 py-1 text-xs font-semibold"
								style={{ background: typeConf.bg, color: typeConf.color }}
							>
								{typeConf.label}
							</span>
						</div>
					</div>

					<div className="p-4">
						<h3 className="font-heading mb-1 text-base font-bold leading-tight">
							{wine.name}
						</h3>

						<div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
							<MapPin className="size-3 shrink-0" />
							<span>{wine.region}</span>
							<span className="mx-0.5 opacity-40">·</span>
							<span>{wine.year}</span>
						</div>

						<p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
							{wine.description}
						</p>

						<div className="flex items-center justify-between">
							<span
								className="font-heading text-xl font-bold"
								style={{ color: "var(--primary)" }}
							>
								€{wine.price}
							</span>
							<span className="text-xs text-muted-foreground">
								View details
							</span>
						</div>
					</div>
				</button>

				<div className="border-t border-border/60 p-4 pt-3">
					{quantity > 0 ? (
						<div className="flex items-center gap-2">
							<QuantityControl
								quantity={quantity}
								onDecrement={() => updateQuantity(wine.id, quantity - 1)}
								onIncrement={() => addToCart(wine)}
							/>
							<Link
								to="/cart"
								className="ml-auto inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
								style={{
									background: "var(--primary)",
									color: "var(--primary-foreground)",
								}}
							>
								<ShoppingCart className="size-3" />
								Cart
							</Link>
						</div>
					) : (
						<Button
							size="sm"
							onClick={() => addToCart(wine)}
							className="w-full rounded-lg text-xs font-semibold"
							style={{
								background: "var(--primary)",
								color: "var(--primary-foreground)",
							}}
						>
							<ShoppingCart className="size-3.5" />
							Add to Cart
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function WineDetailsModal({
	wine,
	onClose,
}: {
	wine: WineProduct;
	onClose: () => void;
}) {
	const { state, addToCart, updateQuantity } = useOrderStore();
	const cartItem = state.items.find((item) => item.product.id === wine.id);
	const quantity = cartItem?.quantity ?? 0;
	const typeConf = wineTypeConfig[wine.type];

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = "";
		};
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close wine overview"
				onClick={onClose}
				className="absolute inset-0 bg-black/55"
			/>
			<div
				className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-label={`${wine.name} details`}
			>
				<div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
					<h2 className="font-heading text-lg font-bold">Wine overview</h2>
					<button
						type="button"
						onClick={onClose}
						className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
					>
						<X className="size-4" />
					</button>
				</div>

				<div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
					<div className="flex min-h-72 items-center justify-center bg-white p-6">
						<img
							src={wine.image}
							alt={wine.name}
							className="h-full max-h-80 w-full object-contain"
						/>
					</div>
					<div className="p-5">
						<div className="mb-2">
							<span
								className="rounded-full px-2.5 py-1 text-xs font-semibold"
								style={{ background: typeConf.bg, color: typeConf.color }}
							>
								{typeConf.label}
							</span>
						</div>
						<h3 className="font-heading mb-1 text-2xl font-bold leading-tight">
							{wine.name}
						</h3>
						<p className="mb-4 text-sm text-muted-foreground">
							{wine.region} · {wine.year}
						</p>
						<p className="mb-5 text-sm leading-relaxed text-muted-foreground">
							{wine.description}
						</p>

						<div className="mb-5 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
							<div className="mb-1 flex items-center justify-between">
								<span className="text-muted-foreground">Vintage</span>
								<span className="font-semibold">{wine.year}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Region</span>
								<span className="font-semibold">{wine.region}</span>
							</div>
						</div>

						{quantity > 0 ? (
							<div
								className="rounded-xl border p-4"
								style={{
									borderColor: "oklch(0.4 0.12 15 / 0.2)",
									background: "oklch(0.4 0.12 15 / 0.04)",
								}}
							>
								<div className="mb-3 flex items-center justify-between">
									<span
										className="font-heading text-2xl font-bold"
										style={{ color: "var(--primary)" }}
									>
										€{wine.price}
									</span>
									<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
										Subtotal: €{(wine.price * quantity).toFixed(0)}
									</span>
								</div>
								<div className="mb-3 flex items-center gap-3">
									<QuantityControl
										quantity={quantity}
										onDecrement={() => updateQuantity(wine.id, quantity - 1)}
										onIncrement={() => addToCart(wine)}
									/>
									<span className="text-xs text-muted-foreground">
										{quantity} {quantity === 1 ? "bottle" : "bottles"}
									</span>
								</div>
								<Link
									to="/cart"
									className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
									style={{
										background: "var(--primary)",
										color: "var(--primary-foreground)",
									}}
								>
									<ShoppingCart className="size-4" />
									Proceed to Cart
								</Link>
							</div>
						) : (
							<>
								<div className="mb-4">
									<span
										className="font-heading text-2xl font-bold"
										style={{ color: "var(--primary)" }}
									>
										€{wine.price}
									</span>
								</div>
								<Button
									className="w-full rounded-xl font-semibold"
									onClick={() => addToCart(wine)}
									style={{
										background: "var(--primary)",
										color: "var(--primary-foreground)",
									}}
								>
									<ShoppingCart className="size-4" />
									Add to Cart
								</Button>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Header ─────────────────────────────────────────────────────────────────────

function Header() {
	const { cartItemCount } = useOrderStore();

	return (
		<header
			className="glass sticky top-0 z-50 border-b border-border/50 bg-background/85"
			style={{ backdropFilter: "blur(12px)" }}
		>
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
				{/* Brand */}
				<Link to="/" className="flex items-center gap-2.5">
					<div
						className="flex size-8 items-center justify-center rounded-lg"
						style={{ background: "var(--primary)" }}
					>
						<Wine
							className="size-4.5"
							style={{ color: "var(--primary-foreground)" }}
						/>
					</div>
					<span
						className="font-heading text-xl font-bold tracking-tight"
						style={{ color: "var(--primary)" }}
					>
						Vinos
					</span>
				</Link>

				{/* Nav */}
				<nav className="hidden items-center gap-6 sm:flex">
					<Link
						to="/how-it-works"
						className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<Info className="size-3.5" />
						How it works
					</Link>
				</nav>

				{/* Cart */}
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
			</div>
		</header>
	);
}

// ─── Hero ────────────────────────────────────────────────────────────────────────

function Hero() {
	return (
		<section
			className="relative overflow-hidden py-20 sm:py-28"
			style={{
				background:
					"linear-gradient(135deg, var(--primary) 0%, oklch(0.3 0.1 20) 100%)",
			}}
		>
			{/* Decorative circles */}
			<div
				className="pointer-events-none absolute -top-20 -right-20 size-96 rounded-full opacity-10"
				style={{ background: "var(--gold)" }}
			/>
			<div
				className="pointer-events-none absolute -bottom-10 -left-10 size-64 rounded-full opacity-10"
				style={{ background: "oklch(0.9 0.01 60)" }}
			/>

			<div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
				<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
					<Sparkles className="size-3.5 text-yellow-200" />
					<span className="text-xs font-medium text-white/90">
						Age-verification powered by
					</span>
					<img
						src="/wine-shop/vidos-logo.svg"
						alt="Vidos"
						className="h-8 w-auto object-contain rounded bg-white px-1.5 py-1"
					/>
				</div>

				<h1 className="font-heading mb-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
					Fine Wines,
					<br />
					<span style={{ color: "oklch(0.9 0.1 85)" }}>Verified Delivery</span>
				</h1>

				<p className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
					Curated wines from Europe's finest estates. Your age and identity
					verified securely with your digital wallet — no forms, no friction.
				</p>

				<div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
					<a
						href="#catalog"
						className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
						style={{
							background: "var(--gold)",
							color: "var(--gold-foreground)",
						}}
					>
						<GlassWater className="size-4" />
						Browse Collection
					</a>
					<Link
						to="/how-it-works"
						className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
					>
						How it works
					</Link>
				</div>
			</div>
		</section>
	);
}

// ─── Footer ──────────────────────────────────────────────────────────────────────

function Footer() {
	return (
		<footer
			className="mt-20 border-t border-border/60 py-10"
			style={{ background: "var(--surface)" }}
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6">
				<div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
					<div className="flex items-center gap-2.5">
						<div
							className="flex size-7 items-center justify-center rounded-lg"
							style={{ background: "var(--primary)" }}
						>
							<Wine
								className="size-4"
								style={{ color: "var(--primary-foreground)" }}
							/>
						</div>
						<span
							className="font-heading text-lg font-bold"
							style={{ color: "var(--primary)" }}
						>
							Vinos
						</span>
					</div>
					<p className="text-xs text-muted-foreground">
						A demo use case for EU Digital Identity Wallet age verification.
						Purchase alcohol responsibly.
					</p>
				</div>
			</div>
		</footer>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────────

function HomePage() {
	const [selectedWine, setSelectedWine] = useState<WineProduct | null>(null);

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main>
				<Hero />

				{/* Catalog */}
				<section id="catalog" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
					<div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h2 className="font-heading text-2xl font-bold sm:text-3xl">
								Our Collection
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								{wines.length} wines from Europe's finest regions
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{wines.map((wine) => (
							<WineCard
								key={wine.id}
								wine={wine}
								onOpenDetails={setSelectedWine}
							/>
						))}
					</div>
				</section>
			</main>
			<Footer />
			{selectedWine && (
				<WineDetailsModal
					wine={selectedWine}
					onClose={() => setSelectedWine(null)}
				/>
			)}
		</div>
	);
}
