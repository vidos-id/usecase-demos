import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	CalendarDays,
	Clock,
	Loader2,
	Search,
	Sparkles,
	Ticket,
	User,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";
import { getBookingIds } from "@/lib/bookings";

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
	const [searchId, setSearchId] = useState("");
	const [lookupId, setLookupId] = useState<string | null>(null);
	const storedIds = useMemo(() => getBookingIds(), []);

	const handleSearch = useCallback(() => {
		const trimmed = searchId.trim();
		if (trimmed) {
			setLookupId(trimmed);
		}
	}, [searchId]);

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
					View your booking history and look up bookings by ID.
				</p>
			</div>

			{/* Lookup bar */}
			<Card className="border-border/50 bg-white/70 backdrop-blur-sm">
				<CardContent className="p-5 space-y-3">
					<h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
						<Search className="h-4 w-4 text-primary/60" />
						Look Up a Booking
					</h2>
					<div className="flex gap-2">
						<Input
							placeholder="Enter booking ID…"
							value={searchId}
							onChange={(e) => setSearchId(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSearch();
							}}
							className="font-mono text-sm bg-white/80"
						/>
						<Button
							onClick={handleSearch}
							disabled={!searchId.trim()}
							className="shrink-0 bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-sm shadow-primary/15"
						>
							<Search className="h-4 w-4" />
							Look Up
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Lookup result */}
			{lookupId && (
				<BookingCard
					bookingId={lookupId}
					isLookup
					onDismiss={() => setLookupId(null)}
				/>
			)}

			{/* Recent bookings */}
			{storedIds.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Clock className="h-4 w-4 text-muted-foreground" />
						<h2 className="text-sm font-semibold tracking-tight">
							Recent Bookings
						</h2>
						<span className="text-xs text-muted-foreground font-mono">
							({storedIds.length})
						</span>
					</div>
					<div className="space-y-3">
						{storedIds.map((id) => (
							<BookingCard key={id} bookingId={id} />
						))}
					</div>
				</div>
			)}

			{/* Empty state */}
			{storedIds.length === 0 && !lookupId && <EmptyBookings />}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Booking card                                                       */
/* ------------------------------------------------------------------ */

function BookingCard({
	bookingId,
	isLookup,
	onDismiss,
}: {
	bookingId: string;
	isLookup?: boolean;
	onDismiss?: () => void;
}) {
	const bookingQuery = useQuery({
		queryKey: ["booking", bookingId],
		queryFn: async () => {
			const res = await apiClient.api.bookings[":id"].$get({
				param: { id: bookingId },
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					(body as { error?: string } | null)?.error ?? "Booking not found",
				);
			}
			return res.json();
		},
		refetchInterval: (query) => {
			const data = query.state.data;
			if (data && "status" in data && data.status === "pending_verification") {
				return 3_000;
			}
			return false;
		},
	});

	if (bookingQuery.isLoading) {
		return (
			<Card className="border-border/30 bg-white/60">
				<CardContent className="p-5 flex items-center gap-3">
					<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					<span className="text-sm text-muted-foreground">
						Loading booking {bookingId.slice(0, 8)}…
					</span>
				</CardContent>
			</Card>
		);
	}

	if (bookingQuery.isError) {
		return (
			<Card className="border-red-200/40 bg-red-50/30">
				<CardContent className="p-5 space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-red-700">
							Booking Not Found
						</span>
						{isLookup && onDismiss && (
							<Button
								variant="ghost"
								size="xs"
								onClick={onDismiss}
								className="text-muted-foreground"
							>
								Dismiss
							</Button>
						)}
					</div>
					<p className="text-xs text-red-600/70">
						{bookingQuery.error.message}
					</p>
					<code className="text-xs font-mono text-muted-foreground block">
						{bookingId}
					</code>
				</CardContent>
			</Card>
		);
	}

	const booking = bookingQuery.data;
	if (!booking || "error" in booking) return null;

	const status = booking.status;
	const isPending = status === "pending_verification";
	const event = "event" in booking ? booking.event : undefined;

	return (
		<Card
			className={`border-border/50 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md ${
				isLookup ? "ring-2 ring-primary/20 shadow-lg shadow-primary/[0.06]" : ""
			}`}
		>
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

				{/* Lookup dismiss */}
				{isLookup && onDismiss && (
					<div className="flex justify-end pt-1">
						<Button
							variant="ghost"
							size="xs"
							onClick={onDismiss}
							className="text-muted-foreground text-xs"
						>
							Dismiss
						</Button>
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
