import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Bot,
	CalendarDays,
	CheckCircle2,
	CircleAlert,
	ClipboardList,
	Eye,
	FileBadge,
	Loader2,
	Sparkles,
	Ticket,
	User,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
	BookingInspectionResponse,
	BookingListItem,
} from "ticket-agent-shared/api/bookings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

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
	const [isInspectOpen, setIsInspectOpen] = useState(false);
	const status = booking.status;
	const isPending = status === "pending_verification";
	const event = booking.event;
	const canInspect = booking.bookedBy === "agent";
	const bookedByLabel =
		booking.bookedBy === "agent"
			? (booking.agentName ?? "Agent")
			: "Booked by you";
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
									{booking.agentName ?? "Agent"}
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

				{canInspect && (
					<div className="flex justify-end">
						<Button
							variant="outline"
							size="sm"
							className="border-primary/20 text-primary hover:bg-primary/5"
							onClick={() => setIsInspectOpen(true)}
						>
							<Eye className="h-3.5 w-3.5" />
							Inspect
						</Button>
					</div>
				)}
			</CardContent>
			{canInspect && (
				<BookingInspectionModal
					booking={booking}
					open={isInspectOpen}
					onOpenChange={setIsInspectOpen}
				/>
			)}
		</Card>
	);
}

function BookingInspectionModal({
	booking,
	open,
	onOpenChange,
}: {
	booking: BookingListItem;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const inspectionQuery = useQuery({
		queryKey: ["booking-inspection", booking.id],
		enabled: open,
		queryFn: async () => {
			const res = await apiClient.api.bookings[":id"].inspection.$get({
				param: { id: booking.id },
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					(body as { error?: string } | null)?.error ??
						"Failed to load booking inspection",
				);
			}

			return res.json() as Promise<BookingInspectionResponse>;
		},
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		const previousOverflow = document.body.style.overflow;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onOpenChange(false);
			}
		};

		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [onOpenChange, open]);

	if (!open) {
		return null;
	}

	const onOverlayKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			onOpenChange(false);
		}
	};

	return (
		<div
			role="presentation"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
			onClick={() => onOpenChange(false)}
			onKeyDown={onOverlayKeyDown}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Inspect agent booking"
				tabIndex={-1}
				className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-border/50 bg-background shadow-2xl"
				onClick={(event) => event.stopPropagation()}
				onKeyDown={(event) => event.stopPropagation()}
			>
				<div className="flex items-start justify-between gap-4 border-b border-border/50 px-6 py-5">
					<div className="space-y-1">
						<p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
							Authorized Submission
						</p>
						<h2 className="text-xl font-semibold tracking-tight">
							Inspect Agent Booking
						</h2>
						<p className="text-sm text-muted-foreground">
							Review the policy results and resolved credential returned by the
							Vidos Authorizer API.
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="shrink-0 rounded-full"
						onClick={() => onOpenChange(false)}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				<div className="grid max-h-[calc(90vh-88px)] overflow-y-auto lg:grid-cols-[0.95fr_1.05fr]">
					<div className="space-y-4 border-b border-border/50 p-6 lg:border-b-0 lg:border-r lg:border-border/50">
						<div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
							<div className="grid gap-3 sm:grid-cols-2">
								<DetailItem label="Booking" value={booking.id} mono />
								<DetailItem
									label="Authorization"
									value={inspectionQuery.data?.authorizationId ?? "Loading..."}
									mono
								/>
								<DetailItem
									label="Event"
									value={booking.event?.name ?? booking.eventId}
								/>
								<DetailItem
									label="Quantity"
									value={`${booking.quantity} ticket${booking.quantity > 1 ? "s" : ""}`}
								/>
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<ClipboardList className="h-4 w-4 text-muted-foreground" />
								<h3 className="text-sm font-semibold tracking-tight">
									Credential Submission Policy Results
								</h3>
							</div>

							{inspectionQuery.isLoading && (
								<LoadingPanel label="Loading policy results..." />
							)}

							{inspectionQuery.isError && (
								<ErrorPanel message={inspectionQuery.error.message} />
							)}

							{inspectionQuery.data &&
								inspectionQuery.data.policyResults.length === 0 && (
									<EmptyPanel label="No policy results were returned for this authorization." />
								)}

							{inspectionQuery.data?.policyResults.map((result, index) => {
								const hasError = Boolean(result.error);

								return (
									<div
										key={`${result.policy}-${index}`}
										className="space-y-3 rounded-2xl border border-border/50 bg-card/60 p-4"
									>
										<div className="flex flex-wrap items-center gap-2">
											<Badge
												variant="outline"
												className={cn(
													"gap-1.5",
													hasError
														? "border-red-200 bg-red-50 text-red-700"
														: "border-emerald-200 bg-emerald-50 text-emerald-700",
												)}
											>
												{hasError ? (
													<CircleAlert className="h-3 w-3" />
												) : (
													<CheckCircle2 className="h-3 w-3" />
												)}
												{hasError ? "Failed" : "Satisfied"}
											</Badge>
											<Badge
												variant="outline"
												className="border-border/60 bg-background text-foreground"
											>
												{result.policy}
											</Badge>
											<Badge
												variant="outline"
												className="border-border/60 bg-background text-muted-foreground"
											>
												{result.service}
											</Badge>
										</div>

										<div className="grid gap-3 sm:grid-cols-2">
											<DetailItem
												label="Path"
												value={formatPath(result.path)}
												mono
											/>
											<DetailItem
												label="Data"
												value={formatJsonPreview(result.data)}
											/>
										</div>

										{result.error && (
											<div className="rounded-xl border border-red-200/60 bg-red-50/70 p-3 text-xs text-red-700">
												<pre className="overflow-x-auto whitespace-pre-wrap font-mono">
													{JSON.stringify(result.error, null, 2)}
												</pre>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>

					<div className="space-y-4 p-6">
						<div className="flex items-center gap-2">
							<FileBadge className="h-4 w-4 text-muted-foreground" />
							<h3 className="text-sm font-semibold tracking-tight">
								Resolved Credential
							</h3>
						</div>

						{inspectionQuery.isLoading && (
							<LoadingPanel label="Loading credential..." />
						)}

						{inspectionQuery.isError && (
							<ErrorPanel message={inspectionQuery.error.message} />
						)}

						{inspectionQuery.data &&
							inspectionQuery.data.credentials.length === 0 && (
								<EmptyPanel label="No credentials were returned for this authorization." />
							)}

						{inspectionQuery.data?.credentials.map((credential, index) => (
							<div
								key={`${credential.credentialType}-${index}`}
								className="space-y-3 rounded-2xl border border-border/50 bg-card/60 p-4"
							>
								<div className="flex flex-wrap items-center gap-2">
									<Badge
										variant="outline"
										className="border-border/60 bg-background text-foreground"
									>
										{credential.credentialType}
									</Badge>
									<Badge
										variant="outline"
										className="border-border/60 bg-background text-muted-foreground"
									>
										{credential.format}
									</Badge>
								</div>

								<DetailItem
									label="Path"
									value={formatPath(credential.path)}
									mono
								/>

								<div className="space-y-1.5">
									<p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
										Claims
									</p>
									<pre className="max-h-[420px] overflow-auto rounded-xl border border-border/50 bg-muted/30 p-4 text-xs leading-6 text-foreground">
										<code>{JSON.stringify(credential.claims, null, 2)}</code>
									</pre>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function DetailItem({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="space-y-1">
			<p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
				{label}
			</p>
			<p
				className={cn(
					"text-sm text-foreground break-all",
					mono && "font-mono text-xs",
				)}
			>
				{value}
			</p>
		</div>
	);
}

function LoadingPanel({ label }: { label: string }) {
	return (
		<div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 p-4 text-sm text-muted-foreground">
			<Loader2 className="h-4 w-4 animate-spin" />
			<span>{label}</span>
		</div>
	);
}

function ErrorPanel({ message }: { message: string }) {
	return (
		<div className="rounded-2xl border border-red-200/60 bg-red-50/60 p-4 text-sm text-red-700">
			{message}
		</div>
	);
}

function EmptyPanel({ label }: { label: string }) {
	return (
		<div className="rounded-2xl border border-border/50 bg-card/60 p-4 text-sm text-muted-foreground">
			{label}
		</div>
	);
}

function formatPath(path: Array<string | number>): string {
	return path.map((segment) => String(segment)).join(".");
}

function formatJsonPreview(value: unknown): string {
	if (value == null) {
		return "No data";
	}

	const json = JSON.stringify(value);
	if (!json) {
		return "No data";
	}

	return json.length > 120 ? `${json.slice(0, 117)}...` : json;
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
