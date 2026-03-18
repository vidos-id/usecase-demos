import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Calendar, Info, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { locations } from "@/data/locations";
import { useBookingStore } from "@/domain/booking/booking-store";

export function SearchBar() {
	const navigate = useNavigate();
	const { setDropoffDateTime, setLocation, setPickupDateTime } =
		useBookingStore();

	const pickupDate = new Date();
	pickupDate.setMonth(pickupDate.getMonth() + 1);
	pickupDate.setHours(10, 0, 0, 0);

	const dropoffDate = new Date(pickupDate);
	dropoffDate.setDate(dropoffDate.getDate() + 5);

	const formatDateTime = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	};

	const pickupDateLabel = pickupDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	const dropoffDateLabel = dropoffDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	const defaultLocation = locations.find((location) => location.code === "FRA");

	const handleSearch = () => {
		if (defaultLocation) {
			setLocation({
				id: defaultLocation.id,
				name: defaultLocation.name,
				code: defaultLocation.code,
			});
		}

		setPickupDateTime(formatDateTime(pickupDate));
		setDropoffDateTime(formatDateTime(dropoffDate));
		navigate({ to: "/search" });
	};

	return (
		<div className="relative z-10 mx-auto -mt-16 max-w-5xl px-4 sm:px-6">
			<div className="rounded-2xl border border-border/50 bg-card p-4 shadow-xl sm:p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					{/* Location */}
					<div className="relative flex-1">
						<MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
						<Input
							value="Frankfurt Airport (FRA)"
							disabled
							className="h-11 rounded-xl border-border/60 bg-muted/40 pl-9 text-sm text-muted-foreground disabled:cursor-default disabled:opacity-70"
						/>
					</div>

					{/* Divider */}
					<div className="hidden h-8 w-px bg-border sm:block" />

					{/* Pickup date */}
					<div className="relative flex-1">
						<Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
						<Input
							value={pickupDateLabel}
							disabled
							className="h-11 rounded-xl border-border/60 bg-muted/40 pl-9 text-sm text-muted-foreground disabled:cursor-default disabled:opacity-70"
						/>
					</div>

					{/* Divider */}
					<div className="hidden h-8 w-px bg-border sm:block" />

					{/* Return date */}
					<div className="relative flex-1">
						<Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
						<Input
							value={dropoffDateLabel}
							disabled
							className="h-11 rounded-xl border-border/60 bg-muted/40 pl-9 text-sm text-muted-foreground disabled:cursor-default disabled:opacity-70"
						/>
					</div>

					{/* Demo indicator + Search button */}
					<div className="flex shrink-0 flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-2">
						<style>{`
						@keyframes nudge-right {
							0%, 100% { transform: translateX(0); }
							50% { transform: translateX(5px); }
						}
						.demo-nudge {
							animation: nudge-right 1s ease-in-out infinite;
						}
					`}</style>
						{/* Mobile: above button */}
						<div className="flex items-center gap-1 sm:hidden">
							<span
								className="text-xs font-semibold tracking-wide"
								style={{ color: "var(--amber)" }}
							>
								Click to start the demo
							</span>
							<ArrowRight
								className="demo-nudge size-3.5"
								style={{ color: "var(--amber)" }}
							/>
						</div>
						{/* Desktop: left of button */}
						<div className="hidden items-center gap-1 sm:flex">
							<span
								className="text-xs font-semibold tracking-wide whitespace-nowrap"
								style={{ color: "var(--amber)" }}
							>
								Start the demo
							</span>
							<ArrowRight
								className="demo-nudge size-3.5"
								style={{ color: "var(--amber)" }}
							/>
						</div>
						<Button
							onClick={handleSearch}
							className="h-11 shrink-0 gap-2 rounded-xl px-6 font-semibold shadow-md transition-transform hover:scale-105"
							style={{
								background: "var(--amber)",
								color: "var(--amber-foreground)",
							}}
						>
							<Search className="size-4" />
							Search Cars
						</Button>
					</div>
				</div>

				{/* Demo note */}
				<div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/70">
					<Info className="size-3 shrink-0" />
					<span>
						Location and dates are prefilled for demo purposes. Click{" "}
						<span className="font-medium text-muted-foreground">
							Search Cars
						</span>{" "}
						to continue.
					</span>
				</div>
			</div>
		</div>
	);
}
