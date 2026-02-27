import { Car as CarIcon, Fuel, Settings2, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Car as CarType } from "@/data/cars";
import { cars } from "@/data/cars";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
	Electric: "bg-emerald-50 text-emerald-700 border-emerald-200",
	"Electric Sedan": "bg-emerald-50 text-emerald-700 border-emerald-200",
	"Electric SUV": "bg-emerald-50 text-emerald-700 border-emerald-200",
	SUV: "bg-blue-50 text-blue-700 border-blue-200",
	"Premium Sedan": "bg-purple-50 text-purple-700 border-purple-200",
	Sedan: "bg-slate-50 text-slate-700 border-slate-200",
	Compact: "bg-orange-50 text-orange-700 border-orange-200",
	"City Car": "bg-pink-50 text-pink-700 border-pink-200",
};

function FuelIcon({ fuelType }: { fuelType: CarType["fuelType"] }) {
	if (fuelType === "Electric") {
		return <Zap className="size-3.5" />;
	}
	return <Fuel className="size-3.5" />;
}

function CarCard({ car, index }: { car: CarType; index: number }) {
	const delayClass =
		[`delay-1`, `delay-2`, `delay-3`, `delay-4`, `delay-5`, `delay-6`][index] ??
		"";

	return (
		<Card
			className={cn(
				"animate-slide-up group overflow-hidden border-border/60 p-0 transition-shadow hover:shadow-md",
				delayClass,
			)}
		>
			{/* Image */}
			<div
				className="relative flex aspect-video items-center justify-center overflow-hidden"
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
						className="size-16 opacity-20 transition-transform duration-500 group-hover:scale-110"
						style={{ color: "var(--primary)" }}
					/>
				)}
				{/* Category badge overlay */}
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
				{/* Price overlay */}
				<div className="absolute right-3 top-3 rounded-lg bg-card/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
					<span
						className="font-heading text-lg font-bold"
						style={{ color: "var(--primary)" }}
					>
						€{car.pricePerDay}
					</span>
					<span className="text-xs text-muted-foreground">/day</span>
				</div>
			</div>

			<CardContent className="px-4 pb-0 pt-4">
				{/* Brand & Name */}
				<p className="mb-0.5 text-xs font-medium text-muted-foreground">
					{car.brand}
				</p>
				<h3 className="font-heading mb-3 text-base font-bold tracking-tight">
					{car.name}
				</h3>

				{/* Specs row */}
				<div className="flex items-center gap-3 text-xs text-muted-foreground">
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
			</CardContent>

			<CardFooter className="px-4 pb-4 pt-4">
				<Button
					variant="outline"
					size="sm"
					className="w-full rounded-lg border-border/60 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
				>
					Select Vehicle
				</Button>
			</CardFooter>
		</Card>
	);
}

export function CarGrid() {
	const featured = cars.slice(0, 6);

	return (
		<section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
			{/* Section header */}
			<div className="mb-10 text-center">
				<Badge
					variant="secondary"
					className="mb-3 font-mono text-xs uppercase tracking-wider"
				>
					Our Fleet
				</Badge>
				<h2 className="font-heading mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
					Popular Vehicles
				</h2>
				<p className="mx-auto max-w-md text-muted-foreground">
					Choose from our carefully curated fleet of premium vehicles across
					Europe.
				</p>
			</div>

			{/* Grid */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{featured.map((car, index) => (
					<CarCard key={car.id} car={car} index={index} />
				))}
			</div>

			{/* Show more */}
			<div className="mt-10 text-center">
				<Button variant="outline" size="lg" className="rounded-xl px-8">
					View All Vehicles
				</Button>
			</div>
		</section>
	);
}
