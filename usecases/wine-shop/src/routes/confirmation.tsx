import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	CheckCircle2,
	ChevronRight,
	Lock,
	Package,
	ShieldCheck,
	Wine,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrderStore } from "@/domain/order/order-store";
import { useDemoReset } from "@/domain/reset/use-demo-reset";
import { useVerificationStore } from "@/domain/verification/verification-store";

export const Route = createFileRoute("/confirmation")({
	component: ConfirmationPage,
});

function ConfirmationPage() {
	const navigate = useNavigate();
	const { state: orderState, completeOrder } = useOrderStore();
	const { state: verificationState } = useVerificationStore();
	const resetDemo = useDemoReset();
	const [completeError, setCompleteError] = useState<string | null>(null);

	const isPaid =
		orderState.status === "payment_confirmed" ||
		orderState.status === "completed";

	// Auto-complete the order on mount
	useEffect(() => {
		if (orderState.status !== "payment_confirmed" || orderState.confirmation) {
			return;
		}
		const result = completeOrder({
			policy: verificationState.policy,
			disclosedClaims: verificationState.disclosedClaims,
		});
		if (!result.ok) {
			setCompleteError(result.error);
		}
	}, [
		orderState.status,
		orderState.confirmation,
		completeOrder,
		verificationState.policy,
		verificationState.disclosedClaims,
	]);

	// Guard: must have paid
	if (!isPaid) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
				<Card className="w-full max-w-md border-border/60">
					<CardContent className="p-8 text-center">
						<Lock className="mx-auto mb-3 size-10 text-muted-foreground/40" />
						<h2 className="font-heading mb-2 text-lg font-bold">
							Payment Required
						</h2>
						<p className="mb-5 text-sm text-muted-foreground">
							Complete payment before viewing confirmation.
						</p>
						<Link to="/payment">
							<Button
								className="rounded-xl"
								style={{
									background: "var(--primary)",
									color: "var(--primary-foreground)",
								}}
							>
								Go to Payment
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	const confirmation = orderState.confirmation;

	if (!confirmation) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background px-4">
				<Card className="w-full max-w-md border-border/60">
					<CardContent className="p-8 text-center">
						<h2 className="font-heading mb-2 text-lg font-bold">
							Finalizing order...
						</h2>
						<p className="text-sm text-muted-foreground">
							Preparing your confirmation details.
						</p>
						{completeError && (
							<p className="mt-3 text-xs text-destructive">{completeError}</p>
						)}
					</CardContent>
				</Card>
			</div>
		);
	}

	const { disclosedClaims, ageCheck } = verificationState;
	const fullName =
		[disclosedClaims?.givenName, disclosedClaims?.familyName]
			.filter(Boolean)
			.join(" ") || null;

	const handleStartOver = () => {
		resetDemo();
		void navigate({ to: "/" });
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
						style={{ color: "oklch(0.52 0.16 145)" }}
					>
						<CheckCircle2 className="size-4" />
						Order Confirmed
					</div>
				</div>
			</header>

			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
				<div className="mx-auto w-full max-w-2xl">
					{/* Success banner */}
					<div
						className="mb-6 animate-slide-down rounded-2xl border p-6 text-center"
						style={{
							borderColor: "oklch(0.52 0.16 145 / 0.4)",
							background: "oklch(0.52 0.16 145 / 0.06)",
						}}
					>
						<div
							className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full"
							style={{ background: "oklch(0.52 0.16 145 / 0.15)" }}
						>
							<CheckCircle2
								className="size-7"
								style={{ color: "oklch(0.52 0.16 145)" }}
							/>
						</div>
						<h1
							className="font-heading mb-1 text-2xl font-bold"
							style={{ color: "oklch(0.42 0.16 145)" }}
						>
							Order Confirmed!
						</h1>
						<p className="text-sm text-muted-foreground">
							Thank you{fullName ? `, ${fullName}` : ""}! Your wine is on its
							way.
						</p>
						<div
							className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
							style={{
								background: "oklch(0.52 0.16 145 / 0.1)",
								color: "oklch(0.42 0.16 145)",
							}}
						>
							<Package className="size-3" />
							Ref:{" "}
							{confirmation.orderReference
								.replace("order_", "")
								.slice(0, 8)
								.toUpperCase()}
						</div>
					</div>

					{/* Order summary */}
					<Card className="mb-5 border-border/60">
						<CardContent className="p-5">
							<h2 className="font-heading mb-4 text-base font-bold">
								Order Details
							</h2>
							<div className="space-y-3">
								{confirmation.items.map((item) => (
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
												{item.product.region} · × {item.quantity}
											</p>
										</div>
										<p className="text-sm font-bold">
											€{(item.product.price * item.quantity).toFixed(0)}
										</p>
									</div>
								))}
							</div>

							<Separator className="my-4" />

							<div className="mb-2 flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Shipping to</span>
								<span className="font-medium">
									{confirmation.shippingDestination.label}
								</span>
							</div>
							<div className="mb-2 flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Address</span>
								<span className="max-w-xs text-right text-xs">
									{confirmation.shippingDestination.address}
								</span>
							</div>

							<Separator className="my-4" />

							<div className="flex items-center justify-between">
								<span className="font-heading font-bold">Total paid</span>
								<span
									className="font-heading text-xl font-bold"
									style={{ color: "var(--primary)" }}
								>
									€{confirmation.total.toFixed(0)}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Credential highlights */}
					<Card className="mb-5 border-border/60">
						<CardContent className="p-5">
							<div className="mb-4 flex items-center gap-2">
								<ShieldCheck
									className="size-4"
									style={{ color: "var(--primary)" }}
								/>
								<h2 className="font-heading text-base font-bold">
									Verified Identity
								</h2>
							</div>

							<div className="space-y-3">
								{/* Portrait */}
								{disclosedClaims?.portrait && (
									<div className="flex items-center gap-4">
										<img
											src={`data:image/jpeg;base64,${disclosedClaims.portrait}`}
											alt="Portrait"
											className="size-16 rounded-full object-cover"
											style={{
												outline: "2px solid var(--primary)",
												outlineOffset: "2px",
											}}
										/>
										{fullName && (
											<div>
												<p className="font-heading font-bold">{fullName}</p>
												<p className="text-xs text-muted-foreground">
													Verified via PID credential
												</p>
											</div>
										)}
									</div>
								)}

								{/* Name (no portrait) */}
								{!disclosedClaims?.portrait && fullName && (
									<div className="flex items-center gap-3">
										<div
											className="flex size-12 items-center justify-center rounded-full font-heading text-lg font-bold"
											style={{
												background: "oklch(0.4 0.12 15 / 0.1)",
												color: "var(--primary)",
											}}
										>
											{fullName.charAt(0)}
										</div>
										<div>
											<p className="font-heading font-bold">{fullName}</p>
											<p className="text-xs text-muted-foreground">
												Verified via PID credential
											</p>
										</div>
									</div>
								)}

								{/* Age verification badge */}
								{ageCheck && (
									<div
										className="flex items-center gap-3 rounded-xl p-3"
										style={{
											background: "oklch(0.52 0.16 145 / 0.07)",
										}}
									>
										<CheckCircle2
											className="size-5 shrink-0"
											style={{ color: "oklch(0.52 0.16 145)" }}
										/>
										<div>
											<p
												className="text-sm font-semibold"
												style={{ color: "oklch(0.42 0.16 145)" }}
											>
												Age verified:{" "}
												{ageCheck.actualAge !== null
													? `${ageCheck.actualAge} years old`
													: "Age confirmed"}
											</p>
											<p className="text-xs text-muted-foreground">
												Meets {ageCheck.requiredAge}+ requirement for{" "}
												{ageCheck.destination}
											</p>
										</div>
									</div>
								)}

								{!fullName && !ageCheck && (
									<p className="text-xs text-muted-foreground">
										No credential details disclosed.
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* CTA */}
					<Button
						className="w-full rounded-xl font-semibold"
						onClick={handleStartOver}
						style={{
							background: "var(--primary)",
							color: "var(--primary-foreground)",
						}}
					>
						Order a new wine
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
