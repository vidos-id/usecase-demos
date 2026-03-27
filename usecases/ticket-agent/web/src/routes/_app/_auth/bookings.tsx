import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Bot,
	CalendarDays,
	Loader2,
	Sparkles,
	Ticket,
	User,
} from "lucide-react";
import { useMemo } from "react";
import type { BookingListItem } from "ticket-agent-shared/api/bookings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app/_auth/bookings")({
	component: BookingsPage,
});

/* ------------------------------------------------------------------ */
/*  Status badge config                                                */
/* ------------------------------------------------------------------ */

const statusStyles: Record<string, string> = {
	confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
	verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
	pending_verification: "border-amber-200 bg-amber-50 text-amber-700",
	rejected: "border-red-200 bg-red-50 text-red-700",
	expired: "border-zinc-200 bg-zinc-50 text-zinc-500",
	error: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels: Record<string, string> = {
	confirmed: "Confirmed",
	verified: "Verified",
	pending_verification: "Pending Verification",
	rejected: "Rejected",
	expired: "Expired",
	error: "Error",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDateTime(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function BookingsPage() {
	const bookingsQuery = useQuery({
		queryKey: ["bookings"],
		queryFn: async () => {
			const res = await apiClient.api.bookings.$get({});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					(body as { error?: string } | null)?.error ??
						"Failed to load bookings",
				);
			}
			return res.json() as Promise<BookingListItem[]>;
		},
		refetchInterval: (query) =>
			query.state.data?.some(
				(booking) => booking.status === "pending_verification",
			)
				? 3_000
				: false,
	});

	const bookings = useMemo(
		() => bookingsQuery.data ?? [],
		[bookingsQuery.data],
	);

	return (
		<div className="space-y-8 animate-slide-up">
			{/* Header */}
			<div className="space-y-2">
				<div className="flex items-center gap-2.5">
					<Sparkles className="h-5 w-5 text-primary/60" />
					<p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
						Bookings
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					My Bookings
				</h1>
				<p className="text-muted-foreground text-sm max-w-lg">
					All bookings tied to your account appear here, including agent-made
					purchases that are still waiting for verification.
				</p>
			</div>

			{bookingsQuery.isLoading && (
				<Card className="border-border/30 bg-white/60">
					<CardContent className="p-5 flex items-center gap-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<span className="text-sm text-muted-foreground">
							Loading your bookings...
						</span>
					</CardContent>
				</Card>
			)}

			{bookingsQuery.isError && (
				<Card className="border-red-200/40 bg-red-50/30">
					<CardContent className="p-5 space-y-2">
						<div className="text-sm font-semibold text-red-700">
							Failed to load bookings
						</div>
						<p className="text-xs text-red-600/70">
							{bookingsQuery.error.message}
						</p>
					</CardContent>
				</Card>
			)}

			{bookings.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Ticket className="h-4 w-4 text-muted-foreground" />
						<h2 className="text-sm font-semibold tracking-tight">
							Your Bookings
						</h2>
						<span className="text-xs text-muted-foreground font-mono">
							({bookings.length})
						</span>
					</div>
					<div className="space-y-3">
						{bookings.map((booking) => (
							<BookingCard key={booking.id} booking={booking} />
						))}
					</div>
				</div>
			)}

			{!bookingsQuery.isLoading &&
				!bookingsQuery.isError &&
				bookings.length === 0 && <EmptyBookings />}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Booking card                                                       */
/* ------------------------------------------------------------------ */

function BookingCard({ booking }: { booking: BookingListItem }) {
	const status = booking.status;
	const isPending = status === "pending_verification";
	const event = booking.event;
	const bookedByLabel =
		booking.bookedBy === "agent" ? "Booked by agent" : "Booked by you";
	const bookedByTone =
		booking.bookedBy === "agent"
			? "border-sky-200 bg-sky-50 text-sky-700"
			: "border-violet-200 bg-violet-50 text-violet-700";

	return (
		<Card className="border-border/50 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
			<CardContent className="p-5 space-y-3">
				{/* Header row */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-start gap-3 min-w-0">
						<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center border border-violet-200/40 shrink-0">
							<Ticket className="h-5 w-5 text-violet-600" />
						</div>
						<div className="min-w-0 space-y-0.5">
							<h3 className="font-semibold tracking-tight text-sm truncate">
								{event?.name ?? `Event ${booking.eventId}`}
							</h3>
							<code className="text-[11px] font-mono text-muted-foreground/60 block truncate">
								{booking.id}
							</code>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<Badge variant="outline" className={bookedByTone}>
							{booking.bookedBy === "agent" ? (
								<>
									<Bot className="h-3 w-3" />
									Agent
								</>
							) : (
								<>
									<User className="h-3 w-3" />
									You
								</>
							)}
						</Badge>
						{isPending && (
							<Loader2 className="h-3 w-3 animate-spin text-amber-500" />
						)}
						<Badge variant="outline" className={statusStyles[status] ?? ""}>
							{statusLabels[status] ?? status}
						</Badge>
					</div>
				</div>

				<Separator className="bg-border/30" />

				{/* Details row */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
					<div className="space-y-0.5">
						<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
							Booked By
						</span>
						<p className="font-semibold text-sm">{bookedByLabel}</p>
					</div>
					<div className="space-y-0.5">
						<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
							Quantity
						</span>
						<p className="font-semibold text-sm">
							{booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}
						</p>
					</div>

					{"delegatorName" in booking && booking.delegatorName && (
						<div className="space-y-0.5">
							<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
								Verified As
							</span>
							<p className="font-semibold text-sm flex items-center gap-1">
								<User className="h-3 w-3 text-muted-foreground" />
								{booking.delegatorName}
							</p>
						</div>
					)}

					{"createdAt" in booking && booking.createdAt && (
						<div className="space-y-0.5">
							<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
								Booked
							</span>
							<p className="font-medium text-xs text-muted-foreground">
								<CalendarDays className="h-3 w-3 inline mr-1" />
								{formatDateTime(booking.createdAt)}
							</p>
						</div>
					)}

					{event && (
						<div className="space-y-0.5">
							<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
								Event Date
							</span>
							<p className="font-medium text-xs text-muted-foreground">
								{new Date(event.date).toLocaleDateString("en-GB", {
									day: "numeric",
									month: "short",
									year: "numeric",
								})}
							</p>
						</div>
					)}
				</div>

				{/* Error message */}
				{"errorMessage" in booking && booking.errorMessage && (
					<div className="px-3 py-2 rounded-lg bg-red-50/50 border border-red-200/30">
						<p className="text-xs text-red-600">{booking.errorMessage}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyBookings() {
	return (
		<div className="flex flex-col items-center justify-center py-20 space-y-4">
			<div className="h-16 w-16 rounded-2xl bg-secondary/60 flex items-center justify-center border border-border/40">
				<Ticket className="h-7 w-7 text-muted-foreground/50" />
			</div>
			<div className="text-center space-y-1.5">
				<h3 className="font-semibold tracking-tight text-foreground/80">
					No bookings yet
				</h3>
				<p className="text-sm text-muted-foreground max-w-xs">
					Book tickets for an event and they will appear here.
				</p>
			</div>
			<Button
				asChild
				variant="outline"
				size="sm"
				className="border-primary/20 text-primary hover:bg-primary/5 group"
			>
				<Link to="/events">
					Browse Events
					<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
				</Link>
			</Button>
		</div>
	);
}
