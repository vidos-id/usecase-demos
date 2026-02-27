import { useNavigate } from "@tanstack/react-router";
import { Calendar, Info, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar() {
	const navigate = useNavigate();
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
							value="Jul 15, 2026"
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
							value="Jul 20, 2026"
							disabled
							className="h-11 rounded-xl border-border/60 bg-muted/40 pl-9 text-sm text-muted-foreground disabled:cursor-default disabled:opacity-70"
						/>
					</div>

					{/* Search button */}
					<Button
						onClick={() => navigate({ to: "/search" })}
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
