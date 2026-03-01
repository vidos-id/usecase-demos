import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	MapPin,
	Minus,
	Plus,
	ShoppingCart,
	Sparkles,
	Trash2,
} from "lucide-react";
import { AgeMethodSelector } from "@/components/age-method-selector";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { ShippingDestination } from "@/data/shipping-destinations";
import { shippingDestinations } from "@/data/shipping-destinations";
import { wines } from "@/data/wines";
import { useOrderStore } from "@/domain/order/order-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cart")({
	component: CartPage,
});

// ─── Country flag emoji helper ──────────────────────────────────────────────────

function countryFlag(country: string): string {
	const map: Record<string, string> = {
		GB: "🇬🇧",
		US: "🇺🇸",
	};
	return map[country] ?? "🌍";
}

// ─── Destination card ────────────────────────────────────────────────────────────

function DestinationCard({
	dest,
	selected,
	onSelect,
}: {
	dest: ShippingDestination;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"w-full rounded-xl border text-left transition-all duration-200",
				selected
					? "border-[var(--primary)] shadow-sm"
					: "border-border/60 bg-card hover:border-border",
			)}
			style={
				selected
					? { borderLeftWidth: "4px", background: "oklch(0.4 0.12 15 / 0.04)" }
					: { borderLeftWidth: "4px", borderLeftColor: "transparent" }
			}
		>
			<div className="flex items-start gap-3 p-4">
				{/* Radio indicator */}
				<div
					className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
					style={
						selected
							? { borderColor: "var(--primary)", background: "var(--primary)" }
							: { borderColor: "var(--border)" }
					}
				>
					{selected && <div className="size-1.5 rounded-full bg-white" />}
				</div>

				{/* Address info */}
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="text-base leading-none">
							{countryFlag(dest.country)}
						</span>
						<p className="font-heading text-sm font-bold">
							{dest.recipientName}
						</p>
						<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
							{dest.country === "GB" ? "Home" : "Office"}
						</span>
						<span
							className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
							style={{
								background: "oklch(0.4 0.12 15 / 0.12)",
								color: "var(--primary)",
							}}
						>
							{dest.legalDrinkingAge}+ min. age
						</span>
					</div>
					<p className="mt-1 text-xs text-muted-foreground">{dest.address}</p>
					<p className="mt-0.5 text-xs text-muted-foreground/70">
						{dest.phone}
					</p>
				</div>
			</div>

			{/* Expanded address details when selected */}
			{selected && (
				<div className="border-t border-border/40 px-4 pb-4 pt-3">
					<div className="grid gap-2 sm:grid-cols-2">
						<SavedAddressField label="Full name" value={dest.recipientName} />
						<SavedAddressField label="Email" value={dest.email} />
						<SavedAddressField label="Phone" value={dest.phone} />
						<SavedAddressField label="Company" value={dest.company ?? "-"} />
						<SavedAddressField
							label="Street address"
							value={dest.streetLine1}
						/>
						<SavedAddressField
							label="Apt / Suite"
							value={dest.streetLine2 ?? "-"}
						/>
						<SavedAddressField label="City" value={dest.city} />
						<SavedAddressField
							label="State / Region"
							value={dest.stateOrRegion}
						/>
						<SavedAddressField label="Postal code" value={dest.postalCode} />
						<SavedAddressField label="Country" value={dest.label} />
					</div>
				</div>
			)}
		</button>
	);
}

function SavedAddressField({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
			<Input
				value={value}
				disabled
				className="bg-muted/40 disabled:opacity-70"
			/>
		</div>
	);
}

// ─── Wine of the Day (empty cart suggestion) ────────────────────────────────────

function EmptyCartWithSuggestion() {
	const { addToCart } = useOrderStore();
	// Pick a featured wine — first red wine as "wine of the day"
	const featured = wines[0];

	return (
		<div className="space-y-6">
			<Card className="border-border/60">
				<CardContent className="flex flex-col items-center gap-4 py-12 text-center">
					<ShoppingCart className="size-10 text-muted-foreground/30" />
					<div>
						<h2 className="font-heading mb-1 text-lg font-bold">
							Your cart is empty
						</h2>
						<p className="text-sm text-muted-foreground">
							Browse our collection or try our pick below.
						</p>
					</div>
					<Link to="/">
						<Button variant="outline" className="rounded-xl">
							Browse wines
						</Button>
					</Link>
				</CardContent>
			</Card>

			{/* Wine of the Day */}
			<Card className="overflow-hidden border-border/60">
				<div
					className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5"
					style={{ background: "oklch(0.4 0.12 15 / 0.04)" }}
				>
					<Sparkles className="size-3.5" style={{ color: "var(--gold)" }} />
					<span
						className="text-xs font-semibold"
						style={{ color: "var(--primary)" }}
					>
						Wine of the Day
					</span>
				</div>
				<CardContent className="p-0">
					<div className="flex gap-4 p-4">
						<div
							className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg"
							style={{ background: "white" }}
						>
							<img
								src={featured.image}
								alt={featured.name}
								className="h-full w-full object-contain p-2"
							/>
						</div>
						<div className="min-w-0 flex-1">
							<h3 className="font-heading mb-0.5 text-sm font-bold">
								{featured.name}
							</h3>
							<div className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
								<MapPin className="size-3 shrink-0" />
								<span>
									{featured.region} · {featured.year}
								</span>
							</div>
							<p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
								{featured.description}
							</p>
							<div className="flex items-center gap-3">
								<span
									className="font-heading text-lg font-bold"
									style={{ color: "var(--primary)" }}
								>
									€{featured.price}
								</span>
								<Button
									size="sm"
									onClick={() => addToCart(featured)}
									className="rounded-lg text-xs font-semibold"
									style={{
										background: "var(--primary)",
										color: "var(--primary-foreground)",
									}}
								>
									<ShoppingCart className="size-3.5" />
									Add to Cart
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────────

function CartPage() {
	const navigate = useNavigate();
	const {
		state,
		removeFromCart,
		updateQuantity,
		setShippingDestination,
		setAgeVerificationMethod,
		proceedToCheckout,
		cartTotal,
		cartItemCount,
	} = useOrderStore();

	const { items, shippingDestination, ageVerificationMethod } = state;

	const handleCheckout = () => {
		const result = proceedToCheckout();
		if (result.ok) {
			void navigate({ to: "/checkout" });
		}
	};

	const canCheckout =
		items.length > 0 &&
		shippingDestination !== null &&
		ageVerificationMethod !== null;

	return (
		<div className="min-h-screen bg-background">
			<Header>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<ShoppingCart className="size-4" />
					<span>
						{cartItemCount} {cartItemCount === 1 ? "item" : "items"}
					</span>
				</div>
			</Header>

			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
				<div className="mx-auto w-full max-w-2xl">
					<h1 className="font-heading mb-8 text-2xl font-bold sm:text-3xl">
						Your Cart
					</h1>

					{/* Empty state */}
					{items.length === 0 ? (
						<EmptyCartWithSuggestion />
					) : (
						<>
							{/* Cart items */}
							<Card className="mb-6 border-border/60">
								<CardContent className="divide-y divide-border/60 p-0">
									{items.map((item) => (
										<div
											key={item.product.id}
											className="flex items-center gap-4 p-4"
										>
											{/* Image */}
											<div
												className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg"
												style={{ background: "white" }}
											>
												<img
													src={item.product.image}
													alt={item.product.name}
													className="h-full w-full object-contain p-1"
												/>
											</div>

											{/* Info */}
											<div className="min-w-0 flex-1">
												<h3 className="font-heading truncate text-sm font-bold">
													{item.product.name}
												</h3>
												<p className="text-xs text-muted-foreground">
													{item.product.region} · {item.product.year}
												</p>
												<p
													className="mt-1 text-sm font-semibold"
													style={{ color: "var(--primary)" }}
												>
													€{(item.product.price * item.quantity).toFixed(0)}
												</p>
											</div>

											{/* Quantity controls */}
											<div className="flex items-center gap-1.5">
												<button
													type="button"
													onClick={() =>
														updateQuantity(item.product.id, item.quantity - 1)
													}
													className="flex size-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
												>
													<Minus className="size-3" />
												</button>
												<span className="w-6 text-center text-sm font-semibold">
													{item.quantity}
												</span>
												<button
													type="button"
													onClick={() =>
														updateQuantity(item.product.id, item.quantity + 1)
													}
													className="flex size-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
												>
													<Plus className="size-3" />
												</button>
											</div>

											{/* Remove */}
											<button
												type="button"
												onClick={() => removeFromCart(item.product.id)}
												className="ml-1 flex size-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
											>
												<Trash2 className="size-3.5" />
											</button>
										</div>
									))}
								</CardContent>
							</Card>

							{/* Shipping destination */}
							<div className="mb-6">
								<h2 className="font-heading mb-3 text-base font-bold">
									Shipping Destination
								</h2>
								<p className="mb-4 text-xs text-muted-foreground">
									Saved addresses are prefilled from your account. Select one to
									use for this order.
								</p>
								<p className="mb-2 text-xs font-semibold text-muted-foreground/80">
									Saved addresses
								</p>
								<div className="grid gap-3">
									{shippingDestinations.map((dest) => (
										<DestinationCard
											key={dest.id}
											dest={dest}
											selected={shippingDestination?.id === dest.id}
											onSelect={() => setShippingDestination(dest)}
										/>
									))}
								</div>
							</div>

							<AgeMethodSelector
								value={ageVerificationMethod}
								requiredAge={shippingDestination?.legalDrinkingAge ?? null}
								onChange={setAgeVerificationMethod}
							/>

							{/* Total + CTA */}
							<Card className="border-border/60">
								<CardContent className="p-5">
									<div className="mb-4 space-y-2">
										{items.map((item) => (
											<div
												key={item.product.id}
												className="flex justify-between text-sm"
											>
												<span className="text-muted-foreground">
													{item.product.name} × {item.quantity}
												</span>
												<span className="font-medium">
													€{(item.product.price * item.quantity).toFixed(0)}
												</span>
											</div>
										))}
									</div>
									<Separator className="mb-4" />
									<div className="mb-5 flex items-center justify-between">
										<span className="font-heading text-base font-bold">
											Total
										</span>
										<span
											className="font-heading text-xl font-bold"
											style={{ color: "var(--primary)" }}
										>
											€{cartTotal.toFixed(0)}
										</span>
									</div>

									{!shippingDestination && (
										<p className="mb-3 text-xs text-destructive">
											Please select a shipping destination to continue.
										</p>
									)}

									{ageVerificationMethod === null && (
										<p className="mb-3 text-xs text-destructive">
											Please select an age verification method to continue.
										</p>
									)}

									{state.lastError && (
										<p className="mb-3 text-xs text-destructive">
											{state.lastError}
										</p>
									)}

									<Button
										className="w-full rounded-xl font-semibold"
										disabled={!canCheckout}
										onClick={handleCheckout}
										style={
											canCheckout
												? {
														background: "var(--primary)",
														color: "var(--primary-foreground)",
													}
												: {}
										}
									>
										Proceed to Checkout
									</Button>

									<div className="mt-4 text-center">
										<Link
											to="/"
											className="text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline"
										>
											← Continue shopping
										</Link>
									</div>
								</CardContent>
							</Card>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
