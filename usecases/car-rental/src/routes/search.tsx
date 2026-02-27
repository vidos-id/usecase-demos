import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VerifyStepBreadcrumb } from "@/components/verification/verify-step-breadcrumb";
import type { Car } from "@/data/cars";
import { cars } from "@/data/cars";
import { useBookingStore } from "@/domain/booking/booking-store";
import { useVerificationStore } from "@/domain/verification/verification-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
	component: SearchPage,
});

function formatDateRangeLabel(
	pickupDateTime: string | null,
	dropoffDateTime: string | null,
): string {
	if (!pickupDateTime || !dropoffDateTime) {
		return "Jul 15 - Jul 20, 2026";
	}

	const pickupDate = new Date(pickupDateTime);
	const dropoffDate = new Date(dropoffDateTime);
	if (
		Number.isNaN(pickupDate.getTime()) ||
		Number.isNaN(dropoffDate.getTime())
	) {
		return "Jul 15 - Jul 20, 2026";
	}

	return `${pickupDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	})} - ${dropoffDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	})}`;
}

function formatDaysLabel(
	pickupDateTime: string | null,
	dropoffDateTime: string | null,
): string {
	if (!pickupDateTime || !dropoffDateTime) {
		return "5 days";
	}

	const pickupDate = new Date(pickupDateTime);
	const dropoffDate = new Date(dropoffDateTime);
	if (
		Number.isNaN(pickupDate.getTime()) ||
		Number.isNaN(dropoffDate.getTime())
	) {
		return "5 days";
	}

	const millisecondsPerDay = 24 * 60 * 60 * 1000;
	const dayDiff = Math.max(
		1,
		Math.round(
			(dropoffDate.getTime() - pickupDate.getTime()) / millisecondsPerDay,
		),
	);

	return `${dayDiff} day${dayDiff === 1 ? "" : "s"}`;
}

// ─── Search summary bar ────────────────────────────────────────────────────────

type SearchSummaryBarProps = {
	locationLabel: string;
	rangeLabel: string;
	daysLabel: string;
	onModifySearch: () => void;
};

function SearchSummaryBar({
	locationLabel,
	rangeLabel,
	daysLabel,
	onModifySearch,
}: SearchSummaryBarProps) {
	return (
		<div
			className="border-b border-border/50 bg-card/80"
			style={{ backdropFilter: "blur(8px)" }}
		>
			<div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
				<div className="flex flex-wrap items-center gap-4 text-sm">
					<span className="flex items-center gap-1.5 font-medium">
						<MapPin className="size-3.5" style={{ color: "var(--primary)" }} />
						{locationLabel}
					</span>
					<ChevronRight className="size-3.5 text-muted-foreground" />
					<span className="flex items-center gap-1.5 text-muted-foreground">
						<Calendar className="size-3.5" />
						{rangeLabel}
					</span>
					<span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
						{daysLabel}
					</span>
				</div>
				<div className="sm:ml-auto">
					<Button
						variant="outline"
						size="sm"
						className="rounded-lg text-xs"
						onClick={onModifySearch}
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
	"Motorcycle",
];
const TRANSMISSIONS = ["All", "Automatic", "Manual"];
const LICENCE_CATEGORIES = ["All", "B", "C1"];

type FilterSidebarProps = {
	selectedCategory: string;
	selectedTransmission: string;
	selectedLicenceCategory: string;
	maxPrice: number;
	onSelectCategory: (category: string) => void;
	onSelectTransmission: (transmission: string) => void;
	onSelectLicenceCategory: (licenceCategory: string) => void;
	onChangeMaxPrice: (maxPrice: number) => void;
};

function FilterSidebar({
	selectedCategory,
	selectedTransmission,
	selectedLicenceCategory,
	maxPrice,
	onSelectCategory,
	onSelectTransmission,
	onSelectLicenceCategory,
	onChangeMaxPrice,
}: FilterSidebarProps) {
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
									cat === selectedCategory
										? "bg-primary/10 font-semibold text-primary"
										: "text-foreground",
								)}
								onClick={() => onSelectCategory(cat)}
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
									t === selectedTransmission
										? "bg-primary/10 font-semibold text-primary"
										: "text-foreground",
								)}
								onClick={() => onSelectTransmission(t)}
							>
								{t}
							</button>
						))}
					</div>
				</div>

				<Separator className="mb-5 opacity-60" />

				{/* Driving licence */}
				<div className="mb-5">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Driving licence
					</p>
					<div className="flex flex-col gap-1">
						{LICENCE_CATEGORIES.map((licenceCategory) => (
							<button
								key={licenceCategory}
								type="button"
								className={cn(
									"rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent",
									licenceCategory === selectedLicenceCategory
										? "bg-primary/10 font-semibold text-primary"
										: "text-foreground",
								)}
								onClick={() => onSelectLicenceCategory(licenceCategory)}
							>
								{licenceCategory}
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
							€{maxPrice}
						</span>
					</div>
					<input
						type="range"
						min={29}
						max={95}
						value={maxPrice}
						onChange={(event) =>
							onChangeMaxPrice(Number(event.currentTarget.value))
						}
						className="mt-3 w-full"
					/>
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
					Identity verification happens with your wallet before payment.
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

type CarCardProps = {
	car: Car;
	onSelect: (car: Car) => void;
	showDemoHint?: boolean;
};

function CarCard({ car, onSelect, showDemoHint }: CarCardProps) {
	const days = 5;
	const total = car.pricePerDay * days;

	return (
		<Card
			className={cn(
				"animate-slide-up group flex flex-col overflow-hidden border-border/60 p-0 transition-shadow hover:shadow-lg sm:flex-row",
			)}
		>
			{/* Image */}
			<div
				className="relative flex aspect-video w-full items-center justify-center overflow-hidden sm:aspect-auto sm:w-72 sm:shrink-0"
				style={{ background: "var(--muted)" }}
			>
				{car.imageUrl ? (
					<img
						src={car.imageUrl}
						alt={car.name}
						className="size-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
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

					{/* CTA with optional demo hint */}
					<div className="relative flex items-center gap-2">
						{showDemoHint && (
							<>
								<style>
									{`@keyframes demo-nudge-right {
										0%, 100% { transform: translateX(0); }
										50% { transform: translateX(5px); }
									}`}
								</style>
								<div
									className="hidden items-center gap-1 whitespace-nowrap text-xs font-semibold sm:flex"
									style={{
										color: "var(--amber)",
										animation: "demo-nudge-right 1.2s ease-in-out infinite",
									}}
								>
									Select a car to proceed
									<ChevronRight className="size-3.5" />
								</div>
							</>
						)}
						<Button
							className="shrink-0 rounded-xl font-semibold"
							onClick={() => onSelect(car)}
							style={{
								background: "var(--amber)",
								color: "var(--amber-foreground)",
							}}
						>
							Select
						</Button>
					</div>
				</CardFooter>
			</div>
		</Card>
	);
}

// ─── Results header ────────────────────────────────────────────────────────────

type SortOption = "price_asc" | "price_desc" | "name_asc";

type ResultsHeaderProps = {
	resultsCount: number;
	sort: SortOption;
	onSortChange: (sort: SortOption) => void;
};

function ResultsHeader({
	resultsCount,
	sort,
	onSortChange,
}: ResultsHeaderProps) {
	return (
		<div className="mb-5 flex items-center justify-between">
			<div>
				<h1 className="font-heading text-xl font-bold tracking-tight">
					Available Cars
				</h1>
				<p className="text-sm text-muted-foreground">
					{resultsCount} vehicle{resultsCount === 1 ? "" : "s"} available
				</p>
			</div>
			<div className="hidden items-center gap-2 sm:flex">
				<span className="text-xs text-muted-foreground">Sort:</span>
				<select
					value={sort}
					onChange={(event) =>
						onSortChange(event.currentTarget.value as SortOption)
					}
					className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium"
				>
					<option value="price_asc">Price low to high</option>
					<option value="price_desc">Price high to low</option>
					<option value="name_asc">Name A-Z</option>
				</select>
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function SearchPage() {
	const navigate = useNavigate();
	const { selectVehicle, state, rewindToStep } = useBookingStore();
	const { resetVerification } = useVerificationStore();
	const [selectedCategory, setSelectedCategory] = useState<string>("All");
	const [selectedTransmission, setSelectedTransmission] =
		useState<string>("All");
	const [selectedLicenceCategory, setSelectedLicenceCategory] =
		useState<string>("All");
	const [maxPrice, setMaxPrice] = useState<number>(95);
	const [sort, setSort] = useState<SortOption>("price_asc");

	const locationLabel = state.rentalDetails.location
		? `${state.rentalDetails.location.name} (${state.rentalDetails.location.code})`
		: "Frankfurt Airport (FRA)";

	const rangeLabel = formatDateRangeLabel(
		state.rentalDetails.pickupDateTime,
		state.rentalDetails.dropoffDateTime,
	);
	const daysLabel = formatDaysLabel(
		state.rentalDetails.pickupDateTime,
		state.rentalDetails.dropoffDateTime,
	);

	const handleSelectCar = (car: Car) => {
		selectVehicle({
			id: car.id,
			name: car.name,
			category: car.category,
			requiredLicenceCategory: car.requiredLicenceCategory,
			imageUrl: car.imageUrl,
			pricePerDay: car.pricePerDay,
			currency: "EUR",
		});
		rewindToStep("review");
		resetVerification();
		navigate({ to: "/review" });
	};

	const filteredAndSortedCars = useMemo(() => {
		const filtered = cars.filter((car) => {
			const matchesCategory =
				selectedCategory === "All" || car.category === selectedCategory;
			const matchesTransmission =
				selectedTransmission === "All" ||
				car.transmission === selectedTransmission;
			const matchesLicenceCategory =
				selectedLicenceCategory === "All" ||
				car.requiredLicenceCategory === selectedLicenceCategory;
			const matchesPrice = car.pricePerDay <= maxPrice;

			return (
				matchesCategory &&
				matchesTransmission &&
				matchesLicenceCategory &&
				matchesPrice
			);
		});

		const sorted = [...filtered];
		if (sort === "price_asc") {
			sorted.sort((a, b) => a.pricePerDay - b.pricePerDay);
		} else if (sort === "price_desc") {
			sorted.sort((a, b) => b.pricePerDay - a.pricePerDay);
		} else {
			sorted.sort((a, b) => a.name.localeCompare(b.name));
		}

		return sorted;
	}, [
		maxPrice,
		selectedCategory,
		selectedLicenceCategory,
		selectedTransmission,
		sort,
	]);

	return (
		<div className="min-h-screen bg-background">
			{/* Compact site header */}
			<header className="glass sticky top-0 z-50 border-b border-border/50 bg-background/80">
				<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
					<Link to="/">
						<img
							src="/car-rental/vidos-drive-logo.svg"
							alt="VidosDrive"
							className="h-8"
						/>
					</Link>
					<VerifyStepBreadcrumb active="select" />
				</div>
			</header>

			{/* Search summary */}
			<SearchSummaryBar
				locationLabel={locationLabel}
				rangeLabel={rangeLabel}
				daysLabel={daysLabel}
				onModifySearch={() => navigate({ to: "/" })}
			/>

			{/* Main content */}
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
					{/* Sidebar */}
					<FilterSidebar
						selectedCategory={selectedCategory}
						selectedTransmission={selectedTransmission}
						selectedLicenceCategory={selectedLicenceCategory}
						maxPrice={maxPrice}
						onSelectCategory={setSelectedCategory}
						onSelectTransmission={setSelectedTransmission}
						onSelectLicenceCategory={setSelectedLicenceCategory}
						onChangeMaxPrice={setMaxPrice}
					/>

					{/* Results */}
					<div className="flex-1 min-w-0">
						<ResultsHeader
							resultsCount={filteredAndSortedCars.length}
							sort={sort}
							onSortChange={setSort}
						/>
						<div className="flex flex-col gap-4">
							{filteredAndSortedCars.map((car, i) => (
								<CarCard
									key={car.id}
									car={car}
									onSelect={handleSelectCar}
									showDemoHint={i === 0}
								/>
							))}
							{filteredAndSortedCars.length === 0 && (
								<Card className="border-border/60">
									<CardContent className="p-5 text-sm text-muted-foreground">
										No cars match current filters. Adjust filters to see more
										options.
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
