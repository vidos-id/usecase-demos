import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	CalendarDays,
	CheckCircle2,
	Loader2,
	MapPin,
	Minus,
	Plus,
	Shield,
	Sparkles,
	Tag,
	Ticket,
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
	{ gradient: string; badge: string; icon: string }
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
			setBookingSuccess({
				id: data.id,
				quantity: data.quantity,
				status: data.status,
				bookedBy: data.bookedBy as "user" | "agent",
				authorizeUrl: "authorizeUrl" in data ? data.authorizeUrl : undefined,
				delegatorName,
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

	return (
		<div className="space-y-8 animate-slide-up">
			{/* Back link */}
			<Link
				to="/events"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
			>
				<ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
				Back to Events
			</Link>

			{/* Hero banner */}
			<div
				className={`relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br ${style.gradient} shadow-xl shadow-primary/10`}
			>
				<div className="absolute inset-0 opacity-15">
					<div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/20" />
					<div className="absolute bottom-8 left-8 w-32 h-32 rounded-full bg-white/10" />
					<div className="absolute top-1/3 left-1/3 w-48 h-48 rounded-full bg-white/10" />
					<div className="absolute bottom-0 right-1/4 w-20 h-20 rounded-full bg-white/15" />
				</div>

				<div className="relative grid overflow-hidden lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
					<div className="px-6 py-8 sm:px-10 sm:py-10 lg:py-12">
						<div className="max-w-2xl space-y-4">
							<span className="text-5xl drop-shadow-lg">{style.icon}</span>
							<Badge
								variant="outline"
								className="border-white/30 bg-white/15 text-white backdrop-blur-sm text-xs"
							>
								<Tag className="h-2.5 w-2.5" />
								{(event as { category: string }).category}
							</Badge>
							<h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
								{event.name}
							</h1>
							<div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
								<div className="flex items-center gap-1.5">
									<MapPin className="h-4 w-4" />
									<span>
										{(event as { venue: string }).venue},{" "}
										{(event as { city: string }).city}
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<CalendarDays className="h-4 w-4" />
									<span>{formatDate((event as { date: string }).date)}</span>
								</div>
							</div>
						</div>
					</div>
					<div className="relative min-h-[300px] border-t border-white/10 bg-white/10 lg:min-h-[380px] lg:border-t-0 lg:border-l lg:border-white/10">
						<EventImage
							eventId={eventId}
							eventName={event.name}
							priority
							variant="hero"
						/>
					</div>
				</div>
			</div>

			{/* Content grid */}
			<div className="grid lg:grid-cols-3 gap-8">
				{/* Left: Event details */}
				<div className="lg:col-span-2 space-y-6">
					{/* Description */}
					<Card className="border-border/50 bg-white/70 backdrop-blur-sm">
						<CardContent className="p-6 space-y-4">
							<h2 className="font-semibold tracking-tight flex items-center gap-2">
								<Sparkles className="h-4 w-4 text-primary/60" />
								About This Event
							</h2>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{(event as { description: string }).description}
							</p>
						</CardContent>
					</Card>

					{/* Quick info */}
					<div className="grid sm:grid-cols-3 gap-4">
						<InfoTile
							label="Price"
							value={`€${(event as { priceEur: number }).priceEur}`}
							icon={<Tag className="h-4 w-4" />}
						/>
						<InfoTile
							label="Available"
							value={`${(event as { availableTickets: number }).availableTickets.toLocaleString()} tickets`}
							icon={<Ticket className="h-4 w-4" />}
						/>
						<InfoTile
							label="Verification"
							value={
								(event as { identityVerificationRequired: boolean })
									.identityVerificationRequired
									? "Required"
									: "Not Required"
							}
							icon={<Shield className="h-4 w-4" />}
						/>
					</div>
				</div>

				{/* Right: Booking card */}
				<div className="lg:col-span-1">
					<Card className="border-border/50 bg-white/70 backdrop-blur-sm shadow-lg shadow-violet-900/[0.04] sticky top-40">
						<CardContent className="p-6 space-y-5">
							<h2 className="font-semibold tracking-tight">Book Tickets</h2>

							{!isVerified ? (
								<VerificationRequired />
							) : (
								<>
									{/* Quantity selector */}
									<div className="space-y-2">
										<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
											Quantity
										</span>
										<div className="flex items-center gap-3">
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() => setQuantity((q) => Math.max(1, q - 1))}
												disabled={quantity <= 1}
											>
												<Minus className="h-3.5 w-3.5" />
											</Button>
											<span className="text-lg font-bold w-8 text-center tabular-nums">
												{quantity}
											</span>
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() =>
													setQuantity((q) => Math.min(maxTickets, q + 1))
												}
												disabled={quantity >= maxTickets}
											>
												<Plus className="h-3.5 w-3.5" />
											</Button>
										</div>
									</div>

									<Separator className="bg-border/40" />

									{/* Price breakdown */}
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm text-muted-foreground">
											<span>
												€{(event as { priceEur: number }).priceEur} × {quantity}
											</span>
											<span>
												€
												{(
													(event as { priceEur: number }).priceEur * quantity
												).toFixed(2)}
											</span>
										</div>
										<div className="flex items-center justify-between font-bold text-lg">
											<span>Total</span>
											<span className="text-primary">
												€
												{(
													(event as { priceEur: number }).priceEur * quantity
												).toFixed(2)}
											</span>
										</div>
									</div>

									{/* Book button */}
									<Button
										onClick={() => bookingMutation.mutate()}
										disabled={bookingMutation.isPending}
										className="w-full h-11 text-sm font-semibold group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-md shadow-primary/15"
									>
										{bookingMutation.isPending ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" />
												Booking…
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
										<p className="text-xs text-destructive text-center">
											{bookingMutation.error.message}
										</p>
									)}

									{/* Note */}
									<div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/[0.03] border border-primary/10">
										<Shield className="h-3.5 w-3.5 text-primary/50 mt-0.5 shrink-0" />
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
/*  Info tile                                                          */
/* ------------------------------------------------------------------ */

function InfoTile({
	label,
	value,
	icon,
}: {
	label: string;
	value: string;
	icon: React.ReactNode;
}) {
	return (
		<Card className="border-border/40 bg-white/60">
			<CardContent className="p-4 space-y-2">
				<div className="flex items-center gap-2 text-muted-foreground">
					{icon}
					<span className="text-xs font-mono uppercase tracking-wider">
						{label}
					</span>
				</div>
				<p className="font-semibold tracking-tight">{value}</p>
			</CardContent>
		</Card>
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
		<div className="max-w-lg mx-auto space-y-6 animate-slide-up">
			{/* Success card */}
			<Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white shadow-xl shadow-emerald-900/[0.06] overflow-hidden">
				{/* Decorative top strip */}
				<div className="h-2 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />

				<CardContent className="p-8 space-y-6">
					{/* Icon + heading */}
					<div className="flex flex-col items-center gap-4 pt-2">
						<div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-200/50 shadow-lg shadow-emerald-100/50">
							<CheckCircle2 className="h-10 w-10 text-emerald-600" />
						</div>
						<div className="text-center space-y-1.5">
							<h2 className="text-xl font-bold tracking-tight text-emerald-900">
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
							value={booking.bookedBy === "agent" ? "AI Agent" : "You"}
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
							check `My Bookings` for the final status.
						</div>
					)}

					{/* Actions */}
					<div className="flex flex-col gap-2.5 pt-2">
						<Button
							asChild
							className="w-full h-11 text-sm font-semibold group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-md shadow-primary/15"
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
		<div className="space-y-8 animate-slide-up">
			<div className="h-4 w-32 bg-muted/40 rounded animate-pulse" />
			<div className="h-48 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 animate-pulse" />
			<div className="grid lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-6">
					<div className="h-40 rounded-xl bg-muted/30 animate-pulse" />
					<div className="grid sm:grid-cols-3 gap-4">
						{["price", "available", "verification"].map((key) => (
							<div
								key={key}
								className="h-24 rounded-xl bg-muted/30 animate-pulse"
							/>
						))}
					</div>
				</div>
				<div className="h-72 rounded-xl bg-muted/30 animate-pulse" />
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Not found                                                          */
/* ------------------------------------------------------------------ */

function EventNotFound() {
	return (
		<div className="flex flex-col items-center justify-center py-20 space-y-4">
			<div className="h-16 w-16 rounded-2xl bg-secondary/60 flex items-center justify-center border border-border/40">
				<CalendarDays className="h-7 w-7 text-muted-foreground/50" />
			</div>
			<div className="text-center space-y-1.5">
				<h3 className="font-semibold tracking-tight text-foreground/80">
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
