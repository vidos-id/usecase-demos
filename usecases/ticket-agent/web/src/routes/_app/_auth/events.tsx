import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	CalendarDays,
	MapPin,
	Search,
	Sparkles,
	Tag,
	Ticket,
} from "lucide-react";
import { z } from "zod";
import { EventImage } from "@/components/event-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

/* ------------------------------------------------------------------ */
/*  Search params schema                                               */
/* ------------------------------------------------------------------ */

const eventsSearchSchema = z.object({
	category: z
		.enum(["concert", "sports", "festival", "theatre", "comedy"])
		.optional()
		.catch(undefined),
	city: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/_app/_auth/events")({
	validateSearch: eventsSearchSchema,
	component: EventsPage,
});

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

type CategoryKey = "concert" | "sports" | "festival" | "theatre" | "comedy";

const categories: { value: CategoryKey; label: string }[] = [
	{ value: "concert", label: "Concerts" },
	{ value: "sports", label: "Sports" },
	{ value: "festival", label: "Festivals" },
	{ value: "theatre", label: "Theatre" },
	{ value: "comedy", label: "Comedy" },
];

const categoryStyles: Record<
	CategoryKey,
	{
		gradient: string;
		badge: string;
		icon: string;
	}
> = {
	concert: {
		gradient: "from-violet-600 via-purple-500 to-fuchsia-500",
		badge: "border-violet-200 bg-violet-50 text-violet-700",
		icon: "🎵",
	},
	sports: {
		gradient: "from-emerald-600 via-green-500 to-teal-400",
		badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
		icon: "⚽",
	},
	festival: {
		gradient: "from-amber-500 via-orange-500 to-red-400",
		badge: "border-amber-200 bg-amber-50 text-amber-700",
		icon: "🎪",
	},
	theatre: {
		gradient: "from-rose-500 via-pink-500 to-fuchsia-400",
		badge: "border-rose-200 bg-rose-50 text-rose-700",
		icon: "🎭",
	},
	comedy: {
		gradient: "from-yellow-500 via-amber-400 to-orange-300",
		badge: "border-yellow-200 bg-yellow-50 text-yellow-700",
		icon: "😂",
	},
};

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function EventsPage() {
	const { category, city } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const eventsQuery = useQuery({
		queryKey: ["events", category, city],
		queryFn: async () => {
			const res = await apiClient.api.events.$get({
				query: {
					category: category ?? undefined,
					city: city ?? undefined,
				},
			});
			if (!res.ok) throw new Error("Failed to fetch events");
			return res.json();
		},
	});

	const events = eventsQuery.data?.events ?? [];

	/* Unique cities for the dropdown */
	const allEventsQuery = useQuery({
		queryKey: ["events", "all-cities"],
		queryFn: async () => {
			const res = await apiClient.api.events.$get({ query: {} });
			if (!res.ok) throw new Error("Failed to fetch events");
			return res.json();
		},
		staleTime: 60_000,
	});

	const allCities = [
		...new Set((allEventsQuery.data?.events ?? []).map((e) => e.city)),
	].sort();

	/* Filter handlers */
	function setCategory(value: string | undefined) {
		navigate({
			search: (prev) => ({
				...prev,
				category: value === undefined ? undefined : (value as CategoryKey),
			}),
		});
	}

	function setCity(value: string | undefined) {
		navigate({
			search: (prev) => ({
				...prev,
				city: value,
			}),
		});
	}

	return (
		<div className="space-y-8 animate-slide-up">
			{/* Header */}
			<div className="space-y-2">
				<div className="flex items-center gap-2.5">
					<Sparkles className="h-5 w-5 text-primary/60" />
					<p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
						Events
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Discover Events
				</h1>
				<p className="text-muted-foreground text-sm max-w-lg">
					Browse upcoming events across Europe. Find concerts, sports,
					festivals, theatre, and comedy shows.
				</p>
			</div>

			{/* Filter bar */}
			<div className="space-y-4">
				{/* Category pills */}
				<div className="flex items-center gap-2 flex-wrap">
					<button
						type="button"
						onClick={() => setCategory(undefined)}
						className={`
							px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200
							${
								!category
									? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
									: "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40"
							}
						`}
					>
						All Events
					</button>
					{categories.map((cat) => {
						const isActive = category === cat.value;
						const style = categoryStyles[cat.value];
						return (
							<button
								key={cat.value}
								type="button"
								onClick={() => setCategory(isActive ? undefined : cat.value)}
								className={`
									px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200
									${
										isActive
											? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
											: "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40"
									}
								`}
							>
								<span className="mr-1.5">{style.icon}</span>
								{cat.label}
							</button>
						);
					})}
				</div>

				{/* City filter */}
				<div className="flex items-center gap-3">
					<Select
						value={city ?? "__all__"}
						onValueChange={(v) => setCity(v === "__all__" ? undefined : v)}
					>
						<SelectTrigger className="w-48 h-9 text-sm bg-white/80 border-border/50">
							<MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
							<SelectValue placeholder="All Cities" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All Cities</SelectItem>
							{allCities.map((c) => (
								<SelectItem key={c} value={c}>
									{c}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{(category || city) && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => navigate({ search: {} })}
							className="text-xs text-muted-foreground hover:text-foreground"
						>
							Clear filters
						</Button>
					)}

					{/* Result count */}
					<span className="text-xs text-muted-foreground ml-auto font-mono">
						{events.length} event{events.length !== 1 ? "s" : ""}
					</span>
				</div>
			</div>

			{/* Event cards grid */}
			{eventsQuery.isLoading ? (
				<EventsGridSkeleton />
			) : events.length === 0 ? (
				<EmptyState onClear={() => navigate({ search: {} })} />
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
					{events.map((event, idx) => (
						<EventCard key={event.id} event={event} index={idx} />
					))}
				</div>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Event card                                                         */
/* ------------------------------------------------------------------ */

interface EventData {
	id: string;
	name: string;
	category: string;
	city: string;
	venue: string;
	date: string;
	priceEur: number;
	availableTickets: number;
	description: string;
}

function EventCard({ event, index }: { event: EventData; index: number }) {
	const cat = event.category as CategoryKey;
	const style = categoryStyles[cat] ?? categoryStyles.concert;

	return (
		<Link
			to="/events/$eventId"
			params={{ eventId: event.id }}
			className="block group"
			style={{ animationDelay: `${index * 50}ms` }}
		>
			<Card className="h-full overflow-hidden border-border/50 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/[0.06]">
				<div className="relative h-52 overflow-hidden border-b border-border/20 bg-slate-100">
					<EventImage eventId={event.id} eventName={event.name} />

					<div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/92 text-2xl shadow-lg shadow-slate-950/10 backdrop-blur-sm">
						<span>{style.icon}</span>
					</div>

					<div className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/92 px-3 py-1 shadow-lg shadow-slate-950/10 backdrop-blur-sm">
						<span className="text-sm font-bold text-foreground">
							€{event.priceEur}
						</span>
					</div>

					<div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/92 px-3 py-1.5 shadow-lg shadow-slate-950/10 backdrop-blur-sm">
						<Ticket className="h-3 w-3 text-foreground/70" />
						<span className="text-xs font-semibold text-foreground/80">
							{event.availableTickets.toLocaleString()} left
						</span>
					</div>
				</div>

				<CardContent className="p-5 space-y-3">
					{/* Name + Badge */}
					<div className="space-y-2">
						<h3 className="font-bold tracking-tight leading-snug line-clamp-2 group-hover:text-primary transition-colors">
							{event.name}
						</h3>
						<Badge variant="outline" className={`${style.badge} text-[11px]`}>
							<Tag className="h-2.5 w-2.5" />
							{event.category}
						</Badge>
					</div>

					{/* Location */}
					<div className="flex items-start gap-2 text-sm text-muted-foreground">
						<MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
						<span className="leading-snug">
							{event.venue}, {event.city}
						</span>
					</div>

					{/* Date */}
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<CalendarDays className="h-3.5 w-3.5 shrink-0" />
						<span>{formatDate(event.date)}</span>
					</div>

					{/* CTA */}
					<div className="pt-2 border-t border-border/30">
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground/60">
								ID: {event.id}
							</span>
							<span className="text-xs font-semibold text-primary group-hover:underline underline-offset-2 flex items-center gap-1">
								View Details
								<Search className="h-3 w-3" />
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ onClear }: { onClear: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center py-20 space-y-4">
			<div className="h-16 w-16 rounded-2xl bg-secondary/60 flex items-center justify-center border border-border/40">
				<Search className="h-7 w-7 text-muted-foreground/50" />
			</div>
			<div className="text-center space-y-1.5">
				<h3 className="font-semibold tracking-tight text-foreground/80">
					No events found
				</h3>
				<p className="text-sm text-muted-foreground max-w-xs">
					Try adjusting your filters or browse all events to discover something
					new.
				</p>
			</div>
			<Button
				variant="outline"
				size="sm"
				onClick={onClear}
				className="border-primary/20 text-primary hover:bg-primary/5"
			>
				Clear all filters
			</Button>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function EventsGridSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (
				<Card
					key={key}
					className="overflow-hidden border-border/30 bg-white/50"
				>
					<div className="h-36 bg-gradient-to-br from-muted/60 to-muted/30 animate-pulse" />
					<CardContent className="p-5 space-y-3">
						<div className="h-5 w-3/4 bg-muted/50 rounded animate-pulse" />
						<div className="h-4 w-1/3 bg-muted/40 rounded-full animate-pulse" />
						<div className="h-4 w-2/3 bg-muted/30 rounded animate-pulse" />
						<div className="h-4 w-1/2 bg-muted/30 rounded animate-pulse" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
