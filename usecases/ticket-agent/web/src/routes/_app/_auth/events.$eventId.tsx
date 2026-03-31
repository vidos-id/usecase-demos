import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	CalendarDays,
	CheckCircle2,
	Clock,
	Loader2,
	MapPin,
	Minus,
	Plus,
	Shield,
	ShieldCheck,
	Sparkles,
	Tag,
	Ticket,
	Users,
} from "lucide-react";
import { useState } from "react";
import { EventImage } from "@/components/event-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/_app/_auth/events/$eventId")({
	component: EventDetailPage,
});

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

type CategoryKey = "concert" | "sports" | "festival" | "theatre" | "comedy";

const categoryStyles: Record<
	CategoryKey,
	{
		gradient: string;
		overlayGradient: string;
		badge: string;
		accent: string;
		icon: string;
	}
> = {
	concert: {
		gradient: "from-violet-600 via-purple-500 to-fuchsia-500",
		overlayGradient: "from-violet-950/90 via-violet-950/60 to-transparent",
		badge: "border-violet-300/40 bg-violet-500/20 text-violet-100",
		accent: "text-violet-400",
		icon: "🎵",
	},
	sports: {
		gradient: "from-emerald-600 via-green-500 to-teal-400",
		overlayGradient: "from-emerald-950/90 via-emerald-950/60 to-transparent",
		badge: "border-emerald-300/40 bg-emerald-500/20 text-emerald-100",
		accent: "text-emerald-400",
		icon: "⚽",
	},
	festival: {
		gradient: "from-amber-500 via-orange-500 to-red-400",
		overlayGradient: "from-amber-950/90 via-amber-950/60 to-transparent",
		badge: "border-amber-300/40 bg-amber-500/20 text-amber-100",
		accent: "text-amber-400",
		icon: "🎪",
	},
	theatre: {
		gradient: "from-rose-500 via-pink-500 to-fuchsia-400",
		overlayGradient: "from-rose-950/90 via-rose-950/60 to-transparent",
		badge: "border-rose-300/40 bg-rose-500/20 text-rose-100",
		accent: "text-rose-400",
		icon: "🎭",
	},
	comedy: {
		gradient: "from-yellow-500 via-amber-400 to-orange-300",
		overlayGradient: "from-yellow-950/90 via-yellow-950/60 to-transparent",
		badge: "border-yellow-300/40 bg-yellow-500/20 text-yellow-100",
		accent: "text-yellow-400",
		icon: "😂",
	},
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function formatTime(dateStr: string): string {
	return new Date(dateStr).toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

interface BookingSuccess {
	id: string;
	quantity: number;
	status: string;
	bookedBy: "user" | "agent";
	authorizeUrl?: string;
	delegatorName?: string;
	agentName?: string;
}

function EventDetailPage() {
	const { eventId } = Route.useParams();
	const { user } = Route.useRouteContext();
	const queryClient = useQueryClient();

	const [quantity, setQuantity] = useState(1);
	const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess | null>(
		null,
	);

	/* Fetch event */
	const eventQuery = useQuery({
		queryKey: ["event", eventId],
		queryFn: async () => {
			const res = await apiClient.api.events[":id"].$get({
				param: { id: eventId },
			});
			if (!res.ok) throw new Error("Event not found");
			return res.json();
		},
	});

	/* Booking mutation */
	const bookingMutation = useMutation({
		mutationFn: async () => {
			const res = await apiClient.api.bookings.$post({
				json: { eventId, quantity },
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					(body as { error?: string } | null)?.error ?? "Booking failed",
				);
			}
			return res.json();
		},
		onSuccess: (data) => {
			const delegatorName =
				"delegatorName" in data ? data.delegatorName : undefined;
			const agentName = "agentName" in data ? data.agentName : undefined;
			setBookingSuccess({
				id: data.id,
				quantity: data.quantity,
				status: data.status,
				bookedBy: data.bookedBy as "user" | "agent",
				authorizeUrl: "authorizeUrl" in data ? data.authorizeUrl : undefined,
				delegatorName,
				agentName,
			});
			queryClient.invalidateQueries({ queryKey: ["bookings"] });
			queryClient.invalidateQueries({ queryKey: ["event", eventId] });
		},
	});

	const event = eventQuery.data;

	if (eventQuery.isLoading) {
		return <DetailSkeleton />;
	}

	if (eventQuery.isError || !event) {
		return <EventNotFound />;
	}

	if (bookingSuccess) {
		return (
			<BookingSuccessView booking={bookingSuccess} eventName={event.name} />
		);
	}

	const cat = (event as { category: string }).category as CategoryKey;
	const style = categoryStyles[cat] ?? categoryStyles.concert;
	const currentUser = user as { identityVerified: boolean };
	const isVerified = currentUser.identityVerified;
	const maxTickets = Math.min(
		(event as { availableTickets: number }).availableTickets,
		10,
	);
	const venue = (event as { venue: string }).venue;
	const city = (event as { city: string }).city;
	const date = (event as { date: string }).date;
	const description = (event as { description: string }).description;
	const priceEur = (event as { priceEur: number }).priceEur;
	const availableTickets = (event as { availableTickets: number })
		.availableTickets;
	const identityRequired = (event as { identityVerificationRequired: boolean })
		.identityVerificationRequired;

	return (
		<div className="animate-slide-up">
			{/* Back link */}
			<Link
				to="/events"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-5"
			>
				<ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
				All Events
			</Link>

			{/* -------------------------------------------------------- */}
			{/*  Cinematic hero                                          */}
			{/* -------------------------------------------------------- */}
			<div className="relative overflow-hidden rounded-2xl border border-border/30 shadow-2xl shadow-black/8 -mx-1">
				{/* Full-bleed event image */}
				<div className="relative h-[340px] sm:h-[400px] lg:h-[420px]">
					<EventImage
						eventId={eventId}
						eventName={event.name}
						priority
						variant="hero"
						className="absolute inset-0"
					/>
					{/* Dark gradient overlay for text readability */}
					<div
						className={`absolute inset-0 bg-gradient-to-r ${style.overlayGradient}`}
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

					{/* Hero content */}
					<div className="relative h-full flex flex-col justify-end p-6 sm:p-8 lg:p-10">
						<div className="max-w-2xl space-y-4">
							{/* Category badge */}
							<Badge
								variant="outline"
								className={`${style.badge} backdrop-blur-md text-xs font-semibold tracking-wide w-fit`}
							>
								<span className="mr-0.5">{style.icon}</span>
								{(event as { category: string }).category}
							</Badge>

							{/* Event title */}
							<h1 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-lg">
								{event.name}
							</h1>

							{/* Meta row */}
							<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/75 text-sm">
								<div className="flex items-center gap-1.5">
									<MapPin className="h-3.5 w-3.5 opacity-70" />
									<span>
										{venue}, {city}
									</span>
								</div>
								<span className="hidden sm:inline text-white/30">|</span>
								<div className="flex items-center gap-1.5">
									<CalendarDays className="h-3.5 w-3.5 opacity-70" />
									<span>{formatDate(date)}</span>
								</div>
								<span className="hidden sm:inline text-white/30">|</span>
								<div className="flex items-center gap-1.5">
									<Clock className="h-3.5 w-3.5 opacity-70" />
									<span>{formatTime(date)}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Info strip below the hero image */}
				<div className="grid grid-cols-3 divide-x divide-border/50 bg-card border-t border-border/30">
					<InfoStripItem
						label="Price"
						value={`€${priceEur}`}
						icon={<Tag className="h-3.5 w-3.5" />}
					/>
					<InfoStripItem
						label="Available"
						value={`${availableTickets.toLocaleString()} tickets`}
						icon={<Ticket className="h-3.5 w-3.5" />}
					/>
					<InfoStripItem
						label="Verification"
						value={identityRequired ? "Required" : "Not Required"}
						icon={<Shield className="h-3.5 w-3.5" />}
					/>
				</div>
			</div>

			{/* -------------------------------------------------------- */}
			{/*  Content grid                                            */}
			{/* -------------------------------------------------------- */}
			<div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-8">
				{/* Left: About */}
				<div className="space-y-6">
					<div className="space-y-4">
						<h2 className="font-brand text-xl font-bold tracking-tight flex items-center gap-2">
							<Sparkles className="h-4 w-4 text-primary/50" />
							About This Event
						</h2>
						<p className="text-[15px] text-muted-foreground leading-relaxed">
							{description}
						</p>
					</div>

					<Separator className="bg-border/40" />

					{/* Detail chips */}
					<div className="flex flex-wrap gap-3">
						<DetailChip
							icon={<MapPin className="h-3.5 w-3.5" />}
							label={`${venue}, ${city}`}
						/>
						<DetailChip
							icon={<CalendarDays className="h-3.5 w-3.5" />}
							label={formatDate(date)}
						/>
						<DetailChip
							icon={<Users className="h-3.5 w-3.5" />}
							label={`${availableTickets.toLocaleString()} seats left`}
						/>
						{identityRequired && (
							<DetailChip
								icon={<ShieldCheck className="h-3.5 w-3.5" />}
								label="ID verification required"
							/>
						)}
					</div>
				</div>

				{/* Right: Booking card */}
				<div className="lg:col-span-1">
					<Card className="border-border/50 bg-card shadow-xl shadow-primary/[0.04] sticky top-36 overflow-hidden">
						{/* Accent top bar */}
						<div className={`h-1 bg-gradient-to-r ${style.gradient}`} />
						<CardContent className="p-6 space-y-5">
							<div className="flex items-center justify-between">
								<h2 className="font-brand text-lg font-bold tracking-tight">
									Book Tickets
								</h2>
								<span className="text-2xl font-extrabold text-foreground tabular-nums">
									€{priceEur}
									<span className="text-xs font-normal text-muted-foreground ml-0.5">
										/ticket
									</span>
								</span>
							</div>

							{!isVerified ? (
								<VerificationRequired />
							) : (
								<>
									{/* Quantity selector */}
									<div className="space-y-2">
										<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
											Quantity
										</span>
										<div className="flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2">
											<Button
												variant="outline"
												size="icon-sm"
												className="rounded-md border-border/60 bg-card hover:bg-background"
												onClick={() => setQuantity((q) => Math.max(1, q - 1))}
												disabled={quantity <= 1}
											>
												<Minus className="h-3.5 w-3.5" />
											</Button>
											<span className="text-lg font-bold w-8 text-center tabular-nums select-none">
												{quantity}
											</span>
											<Button
												variant="outline"
												size="icon-sm"
												className="rounded-md border-border/60 bg-card hover:bg-background"
												onClick={() =>
													setQuantity((q) => Math.min(maxTickets, q + 1))
												}
												disabled={quantity >= maxTickets}
											>
												<Plus className="h-3.5 w-3.5" />
											</Button>
											<span className="text-xs text-muted-foreground ml-auto">
												max {maxTickets}
											</span>
										</div>
									</div>

									<Separator className="bg-border/30" />

									{/* Price breakdown */}
									<div className="space-y-2.5">
										<div className="flex items-center justify-between text-sm text-muted-foreground">
											<span>
												{quantity} x €{priceEur}
											</span>
											<span>€{(priceEur * quantity).toFixed(2)}</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-semibold">Total</span>
											<span className="text-xl font-extrabold tabular-nums text-primary">
												€{(priceEur * quantity).toFixed(2)}
											</span>
										</div>
									</div>

									{/* Book button */}
									<Button
										onClick={() => bookingMutation.mutate()}
										disabled={bookingMutation.isPending}
										className={`w-full h-12 text-sm font-bold group bg-gradient-to-r ${style.gradient} hover:opacity-90 shadow-lg shadow-primary/15 transition-all duration-200 active:scale-[0.98]`}
									>
										{bookingMutation.isPending ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" />
												Booking...
											</>
										) : (
											<>
												<Ticket className="h-4 w-4" />
												Book {quantity} Ticket
												{quantity > 1 ? "s" : ""}
												<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
											</>
										)}
									</Button>

									{bookingMutation.isError && (
										<p className="text-xs text-destructive text-center animate-fade-in">
											{bookingMutation.error.message}
										</p>
									)}

									{/* Note */}
									<div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/30">
										<Shield className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
										<p className="text-[11px] text-muted-foreground leading-relaxed">
											Your verified identity will be used to confirm this
											booking.
										</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Info strip item (horizontal strip below hero)                      */
/* ------------------------------------------------------------------ */

function InfoStripItem({
	label,
	value,
	icon,
}: {
	label: string;
	value: string;
	icon: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center gap-1 py-4 px-3">
			<div className="flex items-center gap-1.5 text-muted-foreground">
				{icon}
				<span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider">
					{label}
				</span>
			</div>
			<p className="text-sm font-bold tracking-tight text-center">{value}</p>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Detail chip                                                        */
/* ------------------------------------------------------------------ */

function DetailChip({ icon, label }: { icon: React.ReactNode; label: string }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 border border-border/40 rounded-full px-3 py-1.5">
			{icon}
			{label}
		</span>
	);
}

/* ------------------------------------------------------------------ */
/*  Verification required                                              */
/* ------------------------------------------------------------------ */

function VerificationRequired() {
	return (
		<div className="space-y-4">
			<div className="flex flex-col items-center gap-3 py-4">
				<div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200/40 flex items-center justify-center">
					<Shield className="h-6 w-6 text-amber-600" />
				</div>
				<div className="text-center space-y-1">
					<h3 className="text-sm font-semibold">
						Identity Verification Required
					</h3>
					<p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
						You must verify your identity before booking tickets.
					</p>
				</div>
			</div>
			<Button
				asChild
				variant="outline"
				className="w-full border-primary/20 text-primary hover:bg-primary/5 group"
			>
				<Link to="/identity">
					Verify Identity
					<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
				</Link>
			</Button>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Booking success                                                    */
/* ------------------------------------------------------------------ */

function BookingSuccessView({
	booking,
	eventName,
}: {
	booking: BookingSuccess;
	eventName: string;
}) {
	return (
		<div className="max-w-lg mx-auto space-y-6 animate-slide-up pt-4">
			{/* Success card */}
			<Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/60 to-white shadow-2xl shadow-emerald-900/8 overflow-hidden">
				{/* Decorative top strip */}
				<div className="h-1.5 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />

				<CardContent className="p-8 space-y-6">
					{/* Icon + heading */}
					<div className="flex flex-col items-center gap-4 pt-2">
						<div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-200/50 shadow-lg shadow-emerald-100/50 animate-scale-in">
							<CheckCircle2 className="h-10 w-10 text-emerald-600" />
						</div>
						<div className="text-center space-y-1.5">
							<h2 className="font-brand text-xl font-bold tracking-tight text-emerald-900">
								Booking Confirmed!
							</h2>
							<p className="text-sm text-emerald-700/70">
								Your tickets have been successfully booked.
							</p>
						</div>
					</div>

					{/* Booking details */}
					<div className="rounded-xl border border-emerald-200/40 bg-white/80 divide-y divide-emerald-100/60">
						<DetailRow label="Booking ID" value={booking.id} mono />
						<DetailRow label="Event" value={eventName} />
						<DetailRow
							label="Quantity"
							value={`${booking.quantity} ticket${booking.quantity > 1 ? "s" : ""}`}
						/>
						<DetailRow
							label="Booked By"
							value={
								booking.bookedBy === "agent"
									? (booking.agentName ?? "AI Agent")
									: "You"
							}
						/>
						<DetailRow label="Status" value={booking.status} />
						{booking.delegatorName && (
							<DetailRow label="Verified As" value={booking.delegatorName} />
						)}
						{booking.authorizeUrl && (
							<DetailRow
								label="Next Step"
								value="Complete agent verification"
							/>
						)}
					</div>

					{booking.authorizeUrl && (
						<div className="rounded-xl border border-amber-200/50 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
							Your agent booking is pending wallet presentation. Finish the
							verification flow with the returned authorization request, then
							check My Bookings for the final status.
						</div>
					)}

					{/* Actions */}
					<div className="flex flex-col gap-2.5 pt-2">
						<Button
							asChild
							className="w-full h-11 text-sm font-semibold group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/15"
						>
							<Link to="/bookings">
								<Ticket className="h-4 w-4" />
								View My Bookings
								<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
							</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="w-full border-border/50 text-muted-foreground hover:text-foreground"
						>
							<Link to="/events">
								<CalendarDays className="h-4 w-4" />
								Browse More Events
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Detail row helper                                                  */
/* ------------------------------------------------------------------ */

function DetailRow({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="flex items-center justify-between px-4 py-3">
			<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
				{label}
			</span>
			<span
				className={`text-sm font-semibold text-foreground inline-flex items-center gap-1.5 ${mono ? "font-mono text-xs" : ""}`}
			>
				{value}
			</span>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function DetailSkeleton() {
	return (
		<div className="animate-slide-up">
			{/* Back link skeleton */}
			<div className="h-4 w-24 bg-muted/40 rounded mb-5 animate-pulse" />

			{/* Hero skeleton */}
			<div className="rounded-2xl overflow-hidden border border-border/30">
				<div className="h-[340px] sm:h-[400px] lg:h-[420px] bg-gradient-to-br from-muted/60 to-muted/30 animate-pulse" />
				<div className="grid grid-cols-3 divide-x divide-border/50 bg-card border-t border-border/30">
					{["price", "available", "verification"].map((key) => (
						<div key={key} className="flex flex-col items-center gap-2 py-4">
							<div className="h-3 w-12 bg-muted/50 rounded animate-pulse" />
							<div className="h-4 w-20 bg-muted/40 rounded animate-pulse" />
						</div>
					))}
				</div>
			</div>

			{/* Content skeleton */}
			<div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-8">
				<div className="space-y-6">
					<div className="space-y-4">
						<div className="h-6 w-48 bg-muted/40 rounded animate-pulse" />
						<div className="space-y-2">
							<div className="h-4 w-full bg-muted/30 rounded animate-pulse" />
							<div className="h-4 w-5/6 bg-muted/30 rounded animate-pulse" />
							<div className="h-4 w-4/6 bg-muted/30 rounded animate-pulse" />
						</div>
					</div>
					<div className="h-px bg-border/40" />
					<div className="flex gap-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-8 w-32 bg-muted/30 rounded-full animate-pulse"
							/>
						))}
					</div>
				</div>
				<div className="h-80 rounded-xl bg-muted/30 animate-pulse border border-border/30" />
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Not found                                                          */
/* ------------------------------------------------------------------ */

function EventNotFound() {
	return (
		<div className="flex flex-col items-center justify-center py-24 space-y-5 animate-fade-in">
			<div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/30">
				<CalendarDays className="h-7 w-7 text-muted-foreground/40" />
			</div>
			<div className="text-center space-y-1.5">
				<h3 className="font-brand text-lg font-bold tracking-tight text-foreground/80">
					Event not found
				</h3>
				<p className="text-sm text-muted-foreground max-w-xs">
					This event may have been removed or the link may be incorrect.
				</p>
			</div>
			<Button
				asChild
				variant="outline"
				size="sm"
				className="border-primary/20 text-primary hover:bg-primary/5"
			>
				<Link to="/events">
					<ArrowLeft className="h-3.5 w-3.5" />
					Back to Events
				</Link>
			</Button>
		</div>
	);
}
