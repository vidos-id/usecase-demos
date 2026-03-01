import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	CheckCircle2,
	ChevronRight,
	CreditCard,
	Lock,
	Wine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrderStore } from "@/domain/order/order-store";
import { useDemoReset } from "@/domain/reset/use-demo-reset";
import { useVerificationStore } from "@/domain/verification/verification-store";

export const Route = createFileRoute("/payment")({
	component: PaymentPage,
});

// ─── Mock payment card ──────────────────────────────────────────────────────────

function MockPaymentCard() {
	return (
		<div
			className="mb-5 overflow-hidden rounded-2xl p-5 shadow-lg"
			style={{
				background:
					"linear-gradient(135deg, var(--wine) 0%, oklch(0.3 0.1 20) 60%, oklch(0.25 0.08 30) 100%)",
			}}
		>
			<div className="mb-6 flex items-start justify-between">
				<div>
					<p className="text-xs font-medium text-white/60">Simulated payment</p>
					<p className="font-heading text-lg font-bold text-white">Demo Card</p>
				</div>
				<div className="flex items-center gap-1">
					<CreditCard className="size-6 text-white/80" />
				</div>
			</div>

			{/* Card number */}
			<div className="mb-5">
				<p
					className="font-mono text-lg tracking-[0.2em] text-white"
					style={{ fontFamily: "var(--font-mono)" }}
				>
					4242 4242 4242 4242
				</p>
			</div>

			{/* Bottom row */}
			<div className="flex items-end justify-between">
				<div>
					<p className="mb-0.5 text-xs text-white/50">Card holder</p>
					<p className="text-sm font-semibold tracking-wide text-white">
						DEMO USER
					</p>
				</div>
				<div className="text-right">
					<p className="mb-0.5 text-xs text-white/50">Expires</p>
					<p className="text-sm font-semibold text-white">12/28</p>
				</div>
				<div className="text-right">
					<p className="mb-0.5 text-xs text-white/50">CVV</p>
					<p className="text-sm font-semibold text-white">•••</p>
				</div>
			</div>

			{/* Gold shimmer strip */}
			<div
				className="mt-4 h-px w-full opacity-30"
				style={{ background: "var(--gold)" }}
			/>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────────

function PaymentPage() {
	const navigate = useNavigate();
	const { state: orderState, confirmPayment } = useOrderStore();
	const { canProceedToPayment, state: verificationState } =
		useVerificationStore();
	const resetDemo = useDemoReset();

	// Guard: verification not complete
	if (!canProceedToPayment) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
				<Card className="w-full max-w-md border-border/60">
					<CardContent className="p-8 text-center">
						<Lock className="mx-auto mb-3 size-10 text-muted-foreground/40" />
						<h2 className="font-heading mb-2 text-lg font-bold">
							Verification Required
						</h2>
						<p className="mb-5 text-sm text-muted-foreground">
							Age verification must be completed before payment can proceed.
						</p>
						<Link to="/checkout">
							<Button
								className="rounded-xl"
								style={{
									background: "var(--primary)",
									color: "var(--primary-foreground)",
								}}
							>
								Go to Verification
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { items, shippingDestination } = orderState;
	const cartTotal = items.reduce(
		(sum, item) => sum + item.product.price * item.quantity,
		0,
	);

	const { disclosedClaims, ageCheck } = verificationState;
	const fullName =
		[disclosedClaims?.givenName, disclosedClaims?.familyName]
			.filter(Boolean)
			.join(" ") || null;

	const handleConfirm = () => {
		const result = confirmPayment();
		if (result.ok) {
			void navigate({ to: "/confirmation" });
		}
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header
				className="glass sticky top-0 z-50 border-b border-border/50 bg-background/85"
				style={{ backdropFilter: "blur(12px)" }}
			>
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
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
					<div
						className="flex items-center gap-2 text-sm font-medium"
						style={{ color: "var(--primary)" }}
					>
						<CreditCard className="size-4" />
						Payment
					</div>
				</div>
			</header>

			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
				<div className="mx-auto w-full max-w-2xl">
					<h1 className="font-heading mb-6 text-2xl font-bold sm:text-3xl">
						Complete Your Order
					</h1>

					{/* Verification success banner */}
					<div
						className="mb-6 rounded-2xl border p-4"
						style={{
							borderColor: "oklch(0.52 0.16 145 / 0.4)",
							background: "oklch(0.52 0.16 145 / 0.05)",
						}}
					>
						<div className="flex items-center gap-3">
							<CheckCircle2
								className="size-5 shrink-0"
								style={{ color: "oklch(0.52 0.16 145)" }}
							/>
							<div>
								<p
									className="font-heading text-sm font-bold"
									style={{ color: "oklch(0.42 0.16 145)" }}
								>
									Age Verified
								</p>
								<p className="text-xs text-muted-foreground">
									{fullName ? `${fullName} — ` : ""}
									{ageCheck?.actualAge !== null &&
									ageCheck?.actualAge !== undefined
										? `${ageCheck.actualAge} years old · `
										: ""}
									Identity confirmed via EU Digital Identity Wallet
								</p>
							</div>
						</div>
					</div>

					{/* Order summary */}
					<Card className="mb-5 border-border/60">
						<CardContent className="p-5">
							<h2 className="font-heading mb-4 text-base font-bold">
								Order Summary
							</h2>
							<div className="space-y-3">
								{items.map((item) => (
									<div
										key={item.product.id}
										className="flex items-center gap-3"
									>
										<div
											className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
											style={{ background: "white" }}
										>
											<img
												src={item.product.image}
												alt={item.product.name}
												className="h-full w-full object-contain p-0.5"
											/>
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold">
												{item.product.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{item.product.region} · {item.product.year} · ×{" "}
												{item.quantity}
											</p>
										</div>
										<p className="text-sm font-bold">
											€{(item.product.price * item.quantity).toFixed(0)}
										</p>
									</div>
								))}
							</div>

							<Separator className="my-4" />

							{shippingDestination && (
								<div className="mb-3 flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Shipping to</span>
									<span className="font-medium">
										{shippingDestination.label}
									</span>
								</div>
							)}

							<div className="flex items-center justify-between">
								<span className="font-heading font-bold">Total</span>
								<span
									className="font-heading text-xl font-bold"
									style={{ color: "var(--primary)" }}
								>
									€{cartTotal.toFixed(0)}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Mock payment card */}
					<MockPaymentCard />

					{/* Confirm button */}
					<Button
						className="w-full rounded-xl font-semibold"
						onClick={handleConfirm}
						style={{
							background: "var(--primary)",
							color: "var(--primary-foreground)",
						}}
					>
						Confirm Order · €{cartTotal.toFixed(0)}
						<ChevronRight className="size-4" />
					</Button>

					<p className="mt-3 text-center text-xs text-muted-foreground">
						Simulated payment — no real transaction will occur
					</p>

					{/* Footer links */}
					<div className="mt-6 flex flex-col items-center gap-2">
						<button
							type="button"
							onClick={() => void navigate({ to: "/checkout" })}
							className="text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline"
						>
							← Back to verification
						</button>
						<button
							type="button"
							onClick={() => {
								resetDemo();
								void navigate({ to: "/" });
							}}
							className="text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline"
						>
							Start a new order
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
