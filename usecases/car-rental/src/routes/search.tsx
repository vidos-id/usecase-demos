import { createFileRoute } from "@tanstack/react-router";
import {
	Calendar,
	Car as CarIcon,
	ChevronRight,
	Fuel,
	MapPin,
	Settings2,
	Shield,
	SlidersHorizontal,
	Users,
	Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Car } from "@/data/cars";
import { cars } from "@/data/cars";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
	component: SearchPage,
});

// ─── Search summary bar ────────────────────────────────────────────────────────

function SearchSummaryBar() {
	return (
		<div
			className="border-b border-border/50 bg-card/80"
			style={{ backdropFilter: "blur(8px)" }}
		>
			<div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
				<div className="flex flex-wrap items-center gap-4 text-sm">
					<span className="flex items-center gap-1.5 font-medium">
						<MapPin className="size-3.5" style={{ color: "var(--primary)" }} />
						Frankfurt Airport (FRA)
					</span>
					<ChevronRight className="size-3.5 text-muted-foreground" />
					<span className="flex items-center gap-1.5 text-muted-foreground">
						<Calendar className="size-3.5" />
						Jul 15 – Jul 20, 2026
					</span>
					<span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
						5 days
					</span>
				</div>
				<div className="sm:ml-auto">
					<Button
						variant="outline"
						size="sm"
						className="rounded-lg text-xs"
						onClick={() => window.history.back()}
					>
						Modify Search
					</Button>
				</div>
			</div>
		</div>
	);
}

// ─── Filter sidebar ────────────────────────────────────────────────────────────

const CATEGORIES = [
	"All",
	"Compact",
	"SUV",
	"Premium Sedan",
	"City Car",
	"Van",
];
const TRANSMISSIONS = ["All", "Automatic", "Manual"];

function FilterSidebar() {
	return (
		<aside className="w-full shrink-0 lg:w-60">
			<div className="rounded-2xl border border-border/60 bg-card p-5">
				<div className="mb-4 flex items-center gap-2">
					<SlidersHorizontal
						className="size-4"
						style={{ color: "var(--primary)" }}
					/>
					<span className="font-heading text-sm font-bold">Filters</span>
				</div>

				{/* Category */}
				<div className="mb-5">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Category
					</p>
					<div className="flex flex-col gap-1">
						{CATEGORIES.map((cat) => (
							<button
								key={cat}
								type="button"
								className={cn(
									"rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent",
									cat === "All"
										? "bg-primary/10 font-semibold text-primary"
										: "text-foreground",
								)}
							>
								{cat}
							</button>
						))}
					</div>
				</div>

				<Separator className="mb-5 opacity-60" />

				{/* Transmission */}
				<div className="mb-5">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Transmission
					</p>
					<div className="flex flex-col gap-1">
						{TRANSMISSIONS.map((t) => (
							<button
								key={t}
								type="button"
								className={cn(
									"rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent",
									t === "All"
										? "bg-primary/10 font-semibold text-primary"
										: "text-foreground",
								)}
							>
								{t}
							</button>
						))}
					</div>
				</div>

				<Separator className="mb-5 opacity-60" />

				{/* Price range */}
				<div>
					<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Max price / day
					</p>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">€29</span>
						<span className="font-semibold" style={{ color: "var(--primary)" }}>
							€95
						</span>
					</div>
					<div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
						<div
							className="h-1.5 rounded-full"
							style={{ width: "100%", background: "var(--primary)" }}
						/>
					</div>
				</div>
			</div>

			{/* Demo identity note */}
			<div
				className="mt-3 rounded-xl border border-border/40 p-4"
				style={{ background: "oklch(0.42 0.10 220 / 0.06)" }}
			>
				<div className="mb-1.5 flex items-center gap-1.5">
					<Shield className="size-3.5" style={{ color: "var(--primary)" }} />
					<span
						className="text-xs font-semibold"
						style={{ color: "var(--primary)" }}
					>
						Verified Rental
					</span>
				</div>
				<p className="text-xs leading-relaxed text-muted-foreground">
					Identity & driving licence verified at checkout via your EU Digital
					Identity Wallet.
				</p>
			</div>
		</aside>
	);
}

// ─── Car card ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
	SUV: "bg-blue-50 text-blue-700 border-blue-200",
	"Premium Sedan": "bg-purple-50 text-purple-700 border-purple-200",
	Compact: "bg-orange-50 text-orange-700 border-orange-200",
	"City Car": "bg-pink-50 text-pink-700 border-pink-200",
	Van: "bg-teal-50 text-teal-700 border-teal-200",
};

function FuelIcon({ fuelType }: { fuelType: Car["fuelType"] }) {
	return fuelType === "Electric" ? (
		<Zap className="size-3.5" />
	) : (
		<Fuel className="size-3.5" />
	);
}

function CarCard({ car, index }: { car: Car; index: number }) {
	const days = 5;
	const total = car.pricePerDay * days;
	const delayClass =
		(
			[
				"delay-1",
				"delay-2",
				"delay-3",
				"delay-4",
				"delay-5",
				"delay-6",
				"delay-7",
				"delay-8",
			] as const
		)[index] ?? "";

	return (
		<Card
			className={cn(
				"animate-slide-up group flex flex-col overflow-hidden border-border/60 p-0 transition-shadow hover:shadow-lg sm:flex-row",
				delayClass,
			)}
		>
			{/* Image */}
			<div
				className="relative flex aspect-video w-full items-center justify-center overflow-hidden sm:aspect-auto sm:w-56 sm:shrink-0"
				style={{ background: "var(--muted)" }}
			>
				{car.imageUrl ? (
					<img
						src={car.imageUrl}
						alt={car.name}
						className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>
				) : (
					<CarIcon
						className="size-14 opacity-20"
						style={{ color: "var(--primary)" }}
					/>
				)}
				{/* Category badge */}
				<div className="absolute left-3 top-3">
					<span
						className={cn(
							"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
							CATEGORY_COLORS[car.category] ??
								"bg-secondary text-secondary-foreground border-secondary",
						)}
					>
						{car.category}
					</span>
				</div>
			</div>

			{/* Content */}
			<div className="flex flex-1 flex-col">
				<CardContent className="flex-1 px-5 pb-0 pt-5">
					<p className="mb-0.5 text-xs font-medium text-muted-foreground">
						{car.brand}
					</p>
					<h3 className="font-heading mb-3 text-lg font-bold tracking-tight">
						{car.name}
					</h3>

					{/* Specs */}
					<div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<Settings2 className="size-3.5" />
							{car.transmission}
						</span>
						<span className="text-border">·</span>
						<span className="flex items-center gap-1">
							<Users className="size-3.5" />
							{car.seats} seats
						</span>
						<span className="text-border">·</span>
						<span className="flex items-center gap-1">
							<FuelIcon fuelType={car.fuelType} />
							{car.fuelType}
						</span>
					</div>

					{/* Features */}
					<div className="flex flex-wrap gap-1.5">
						{car.features.map((f) => (
							<Badge
								key={f}
								variant="secondary"
								className="rounded-full px-2.5 py-0.5 text-xs font-normal"
							>
								{f}
							</Badge>
						))}
					</div>
				</CardContent>

				<CardFooter className="flex items-center justify-between gap-4 px-5 pb-5 pt-4">
					{/* Pricing */}
					<div>
						<div className="flex items-baseline gap-1">
							<span
								className="font-heading text-2xl font-bold"
								style={{ color: "var(--primary)" }}
							>
								€{car.pricePerDay}
							</span>
							<span className="text-xs text-muted-foreground">/day</span>
						</div>
						<p className="text-xs text-muted-foreground">
							€{total} total · {days} days
						</p>
					</div>

					{/* CTA */}
					<Button
						className="shrink-0 rounded-xl font-semibold"
						style={{
							background: "var(--amber)",
							color: "var(--amber-foreground)",
						}}
					>
						Select
					</Button>
				</CardFooter>
			</div>
		</Card>
	);
}

// ─── Results header ────────────────────────────────────────────────────────────

function ResultsHeader() {
	return (
		<div className="mb-5 flex items-center justify-between">
			<div>
				<h1 className="font-heading text-xl font-bold tracking-tight">
					Available Cars
				</h1>
				<p className="text-sm text-muted-foreground">
					{cars.length} vehicles · Frankfurt Airport · Jul 15–20
				</p>
			</div>
			<div className="hidden items-center gap-2 sm:flex">
				<span className="text-xs text-muted-foreground">Sort:</span>
				<button
					type="button"
					className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
				>
					Price ↑
				</button>
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function SearchPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Compact site header */}
			<header className="glass sticky top-0 z-50 border-b border-border/50 bg-background/80">
				<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
					<div className="flex items-center gap-2">
						<div
							className="flex size-8 items-center justify-center rounded-lg"
							style={{ background: "var(--primary)" }}
						>
							<CarIcon className="size-4" style={{ color: "var(--amber)" }} />
						</div>
						<span className="font-heading text-xl font-bold tracking-tight">
							VROOM
						</span>
					</div>
					{/* Step breadcrumb */}
					<div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
						<span className="font-medium" style={{ color: "var(--primary)" }}>
							1. Select Car
						</span>
						<ChevronRight className="size-3" />
						<span>2. Verify Identity</span>
						<ChevronRight className="size-3" />
						<span>3. Payment</span>
						<ChevronRight className="size-3" />
						<span>4. Confirmation</span>
					</div>
				</div>
			</header>

			{/* Search summary */}
			<SearchSummaryBar />

			{/* Main content */}
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
					{/* Sidebar */}
					<FilterSidebar />

					{/* Results */}
					<div className="flex-1 min-w-0">
						<ResultsHeader />
						<div className="flex flex-col gap-4">
							{cars.map((car, i) => (
								<CarCard key={car.id} car={car} index={i} />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
