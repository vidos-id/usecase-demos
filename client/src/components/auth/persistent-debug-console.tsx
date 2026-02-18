import { Bug, ChevronDown, Info, Trash2, X } from "lucide-react";
import {
	type MouseEvent as ReactMouseEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import {
	DEBUG_EVENT_META,
	type DebugEventType,
	type DebugLevel,
	type DebugSseEvent,
} from "shared/api/debug-sse";
import { Button } from "@/components/ui/button";
import { useDebugStream } from "@/lib/use-debug-stream";
import { cn } from "@/lib/utils";

const CLIENT_DEBUG_BUFFER_LIMIT = 500;
const STORAGE_KEYS = {
	expanded: "debug-console-expanded",
	bottomSize: "debug-console-bottom-size",
	offsetRight: "debug-console-offset-right",
} as const;

const DEFAULT_LEVEL_VISIBILITY: Record<DebugLevel, boolean> = {
	info: true,
	warn: true,
	error: true,
	debug: false,
};

const DEFAULT_TYPE_VISIBILITY: Record<DebugEventType, boolean> = {
	vidos_request: true,
	vidos_response: true,
	dc_api_forwarded: true,
	credential_result: true,
	policy_result: true,
	error: true,
};

const PANEL_WIDTH = 900;

type PersistentDebugConsoleProps = {
	requestId: string | null;
	debugSessionId?: string;
};

export function PersistentDebugConsole({
	requestId,
	debugSessionId,
}: PersistentDebugConsoleProps) {
	const [isExpanded, setIsExpanded] = useState(() => {
		const stored = localStorage.getItem(STORAGE_KEYS.expanded);
		return stored === "true";
	});
	const [bottomSize, setBottomSize] = useState(() => {
		const stored = Number(localStorage.getItem(STORAGE_KEYS.bottomSize));
		if (Number.isFinite(stored) && stored >= 220 && stored <= 600) {
			return stored;
		}
		return 300;
	});
	// Horizontal offset from the right edge of the viewport
	const [offsetRight, setOffsetRight] = useState(() => {
		const stored = Number(localStorage.getItem(STORAGE_KEYS.offsetRight));
		return Number.isFinite(stored) && stored >= 0 ? stored : 16;
	});

	const [events, setEvents] = useState<DebugSseEvent[]>([]);
	const [levelVisibility, setLevelVisibility] = useState(
		DEFAULT_LEVEL_VISIBILITY,
	);
	const [typeVisibility, setTypeVisibility] = useState(DEFAULT_TYPE_VISIBILITY);
	const [selectedEvent, setSelectedEvent] = useState<DebugSseEvent | null>(
		null,
	);
	const [tooltipState, setTooltipState] = useState<{
		type: DebugEventType;
		x: number;
		y: number;
	} | null>(null);
	const listRef = useRef<HTMLDivElement | null>(null);
	const resizingRef = useRef(false);
	const draggingRef = useRef(false);
	const dragStartXRef = useRef(0);
	const dragStartOffsetRef = useRef(0);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEYS.expanded, String(isExpanded));
	}, [isExpanded]);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEYS.bottomSize, String(bottomSize));
	}, [bottomSize]);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEYS.offsetRight, String(offsetRight));
	}, [offsetRight]);

	useDebugStream({
		requestId,
		debugSessionId,
		enabled: Boolean(requestId),
		onEvent: (event) => {
			setEvents((prev) => {
				const next = [...prev, event];
				if (next.length <= CLIENT_DEBUG_BUFFER_LIMIT) {
					return next;
				}
				return next.slice(next.length - CLIENT_DEBUG_BUFFER_LIMIT);
			});
		},
		onParseError: (error) => {
			const parseErrorEvent: DebugSseEvent = {
				eventType: "error",
				level: "error",
				timestamp: new Date().toISOString(),
				message: "Failed to parse debug event payload.",
				code: "debug_parse_error",
				details: { reason: error.message },
			};

			setEvents((prev) => {
				const next = [...prev, parseErrorEvent];
				if (next.length <= CLIENT_DEBUG_BUFFER_LIMIT) {
					return next;
				}
				return next.slice(next.length - CLIENT_DEBUG_BUFFER_LIMIT);
			});
		},
	});

	const visibleEvents = useMemo(() => {
		return events.filter(
			(event) =>
				levelVisibility[event.level] && typeVisibility[event.eventType],
		);
	}, [events, levelVisibility, typeVisibility]);

	useEffect(() => {
		if (!isExpanded) return;
		if (visibleEvents.length === 0) return;
		const list = listRef.current;
		if (!list) return;
		list.scrollTop = list.scrollHeight;
	}, [isExpanded, visibleEvents]);

	const toggleLevel = (level: DebugLevel) => {
		setLevelVisibility((prev) => ({ ...prev, [level]: !prev[level] }));
	};

	const toggleType = (eventType: DebugEventType) => {
		setTypeVisibility((prev) => ({ ...prev, [eventType]: !prev[eventType] }));
	};

	const hasPayload = (event: DebugSseEvent): boolean => {
		return (
			(event.eventType === "vidos_request" && event.payload != null) ||
			(event.eventType === "vidos_response" && event.payload != null) ||
			(event.eventType === "credential_result" && event.claims != null) ||
			event.eventType === "policy_result"
		);
	};

	const getPayloadData = (event: DebugSseEvent): unknown => {
		if (event.eventType === "vidos_request") return event.payload;
		if (event.eventType === "vidos_response") return event.payload;
		if (event.eventType === "credential_result") return event.claims;
		if (event.eventType === "policy_result") {
			const payload = {
				outcome: event.outcome,
				authorizationId: event.authorizationId,
				...(event.policies && { policies: event.policies }),
				...(event.errorInfo && { errorInfo: event.errorInfo }),
			};
			return payload;
		}
		return null;
	};

	const hasEvents = events.length > 0;

	// Close modal on Escape key
	useEffect(() => {
		if (!selectedEvent) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setSelectedEvent(null);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [selectedEvent]);

	// Global mouse move/up handler — handles both resize and drag
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (resizingRef.current) {
				const maxBottomSize = Math.min(600, window.innerHeight - 120);
				const next = window.innerHeight - e.clientY;
				setBottomSize(Math.max(220, Math.min(maxBottomSize, next)));
				return;
			}
			if (draggingRef.current) {
				const dx = e.clientX - dragStartXRef.current;
				// Moving right → panel moves right → offsetRight decreases
				const rawOffset = dragStartOffsetRef.current - dx;
				const panelWidth = Math.min(PANEL_WIDTH, window.innerWidth * 0.96);
				const maxOffset = window.innerWidth - panelWidth;
				setOffsetRight(Math.max(0, Math.min(maxOffset, rawOffset)));
			}
		};

		const handleMouseUp = () => {
			if (resizingRef.current) {
				resizingRef.current = false;
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
			}
			if (draggingRef.current) {
				draggingRef.current = false;
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
			}
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, []);

	const startResize = (e: ReactMouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		resizingRef.current = true;
		document.body.style.userSelect = "none";
		document.body.style.cursor = "ns-resize";
	};

	const startDrag = (e: ReactMouseEvent<HTMLDivElement>) => {
		// Only trigger on direct clicks on the header bar (not buttons inside it)
		if ((e.target as HTMLElement).closest("button")) return;
		e.preventDefault();
		draggingRef.current = true;
		dragStartXRef.current = e.clientX;
		dragStartOffsetRef.current = offsetRight;
		document.body.style.userSelect = "none";
		document.body.style.cursor = "grabbing";
	};

	return (
		<div
			className="fixed bottom-0 z-40 flex flex-col items-end"
			style={{ right: `${offsetRight}px` }}
		>
			{/* Panel */}
			{isExpanded && (
				<div
					className="w-[min(96vw,900px)] flex flex-col overflow-hidden rounded-t-xl border border-b-0 border-primary/30 bg-background shadow-[0_-4px_32px_rgba(0,0,0,0.18)] backdrop-blur"
					style={{ height: `${bottomSize}px` }}
				>
					{/* Resize handle (top edge) */}
					<button
						type="button"
						onMouseDown={startResize}
						className="absolute -top-1 left-0 right-0 h-2 z-10 cursor-ns-resize"
						aria-label="Resize debug panel"
					/>

					{/* Top separator bar — strong visual break from app */}
					<div className="h-1 w-full shrink-0 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

					{/* Header — draggable */}
					<div
						onMouseDown={startDrag}
						className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/60 bg-muted/30 shrink-0 cursor-grab active:cursor-grabbing select-none"
					>
						<div className="flex items-center gap-2.5">
							<Bug className="w-4 h-4 text-primary" />
							<span className="text-sm font-semibold text-foreground font-mono uppercase tracking-wider">
								Debug Console
							</span>
							<span className="text-xs text-muted-foreground font-mono">
								{events.length} events
							</span>
						</div>
						<div className="flex items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setEvents([])}
								className="h-7 gap-1.5 text-xs"
							>
								<Trash2 className="h-3 w-3" />
								Clear
							</Button>
						</div>
					</div>

					{/* Body: left sidebar (filters) + right (events) */}
					<div className="flex flex-1 min-h-0">
						{/* Left sidebar — Levels & Types */}
						<div className="w-44 shrink-0 flex flex-col gap-4 px-3 py-3 border-r border-border/60 bg-muted/10 overflow-y-auto">
							<div className="flex flex-col gap-1.5">
								<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
									Levels
								</span>
								{(["info", "warn", "error", "debug"] as const).map((level) => (
									<button
										key={level}
										type="button"
										onClick={() => toggleLevel(level)}
										className={cn(
											"rounded-md border px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors text-left",
											levelVisibility[level]
												? "border-primary/40 bg-primary/10 text-primary"
												: "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
										)}
									>
										{level}
									</button>
								))}
							</div>
							<div className="flex flex-col gap-1.5">
								<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
									Types
								</span>
								{(Object.keys(DEFAULT_TYPE_VISIBILITY) as DebugEventType[]).map(
									(eventType) => (
										<div key={eventType} className="flex items-center gap-1">
											<button
												type="button"
												onClick={() => toggleType(eventType)}
												className={cn(
													"rounded-md border px-2 py-1 text-[10px] font-mono transition-colors text-left flex-1",
													typeVisibility[eventType]
														? "border-primary/40 bg-primary/10 text-primary"
														: "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
												)}
											>
												{DEBUG_EVENT_META[eventType].label}
											</button>
											<div className="relative flex items-center">
												<Info
													className="h-3 w-3 text-muted-foreground/60 cursor-help"
													onMouseEnter={(e) => {
														const rect =
															e.currentTarget.getBoundingClientRect();
														setTooltipState({
															type: eventType,
															x: rect.right + 6,
															y: rect.top,
														});
													}}
													onMouseLeave={() => setTooltipState(null)}
												/>
											</div>
										</div>
									),
								)}
							</div>
						</div>

						{/* Event list */}
						<div ref={listRef} className="flex-1 overflow-y-auto p-3">
							{visibleEvents.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-full text-center py-8">
									<div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
										<Bug className="w-6 h-6 text-muted-foreground/40" />
									</div>
									<p className="text-sm text-muted-foreground">
										{events.length === 0
											? "No debug events yet"
											: "No events match current filters"}
									</p>
									<p className="text-xs text-muted-foreground/60 mt-1">
										{events.length === 0
											? "Events will appear here during auth flows"
											: "Adjust filters to see events"}
									</p>
								</div>
							) : (
								<div className="space-y-1.5">
									{visibleEvents.map((event, index) => {
										const clickable = hasPayload(event);
										return (
											<div
												key={`${event.timestamp}-${index}-${event.message}`}
												className={cn(
													"rounded-md border border-border/60 bg-card px-2.5 py-2 hover:border-border transition-colors",
													clickable && "cursor-pointer hover:bg-muted/20",
												)}
												onClick={() => clickable && setSelectedEvent(event)}
											>
												<div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
													<span className="font-mono text-muted-foreground text-[10px]">
														{new Date(event.timestamp).toLocaleTimeString()}
													</span>
													<span
														className={cn(
															"rounded px-1.5 py-0.5 font-mono uppercase text-[9px] font-bold tracking-wider",
															event.level === "error" &&
																"bg-destructive/20 text-destructive",
															event.level === "warn" &&
																"bg-amber-500/20 text-amber-700 dark:text-amber-400",
															event.level === "info" &&
																"bg-blue-500/20 text-blue-700 dark:text-blue-400",
															event.level === "debug" &&
																"bg-muted text-muted-foreground",
														)}
													>
														{event.level}
													</span>
													<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
														{DEBUG_EVENT_META[event.eventType].label}
													</span>
													{event.eventType === "vidos_request" && (
														<>
															<span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 uppercase tracking-wider">
																→ REQ
															</span>
															<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
																{event.method} {event.operation}
															</span>
														</>
													)}
													{event.eventType === "vidos_response" && (
														<>
															<span
																className={cn(
																	"rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
																	event.ok
																		? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
																		: "bg-destructive/20 text-destructive",
																)}
															>
																← RES
															</span>
															<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
																{event.operation}
															</span>
															<span
																className={cn(
																	"rounded px-1.5 py-0.5 font-mono text-[9px]",
																	event.ok
																		? "bg-green-500/20 text-green-700 dark:text-green-400"
																		: "bg-destructive/20 text-destructive",
																)}
															>
																{event.httpStatus}
															</span>
															<span className="font-mono text-[9px] text-muted-foreground">
																{event.durationMs}ms
															</span>
														</>
													)}
													{event.eventType === "credential_result" && (
														<>
															<span className="rounded bg-green-500/20 px-1.5 py-0.5 font-mono text-[9px] text-green-700 dark:text-green-400">
																{event.source}
															</span>
															{event.httpStatus != null && (
																<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
																	{event.httpStatus}
																</span>
															)}
															{event.durationMs != null && (
																<span className="font-mono text-[9px] text-muted-foreground">
																	{event.durationMs}ms
																</span>
															)}
														</>
													)}
													{event.eventType === "policy_result" && (
														<>
															<span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">
																{event.source}
															</span>
															<span
																className={cn(
																	"rounded px-1.5 py-0.5 font-mono text-[9px]",
																	event.outcome === "authorized"
																		? "bg-green-500/20 text-green-700 dark:text-green-400"
																		: "bg-destructive/20 text-destructive",
																)}
															>
																{event.outcome}
															</span>
														</>
													)}
													{event.eventType === "error" && event.code && (
														<span className="rounded bg-destructive/20 px-1.5 py-0.5 font-mono text-[9px] text-destructive">
															{event.code}
														</span>
													)}
												</div>
												<p className="text-[11px] leading-relaxed text-foreground">
													{event.message}
												</p>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{tooltipState &&
				createPortal(
					<div
						className="fixed z-[9999] w-56 rounded-lg border border-border/60 bg-popover p-2 shadow-lg pointer-events-none"
						style={{ top: tooltipState.y, left: tooltipState.x }}
					>
						<p className="text-[10px] leading-relaxed text-muted-foreground">
							{DEBUG_EVENT_META[tooltipState.type].description}
						</p>
					</div>,
					document.body,
				)}

			{/* Toggle button — always below panel */}
			<button
				type="button"
				onClick={() => setIsExpanded((prev) => !prev)}
				className={cn(
					"flex h-8 items-center gap-2 px-2.5 text-[11px] font-mono text-foreground transition hover:bg-primary/5",
					isExpanded
						? "w-[min(96vw,900px)] justify-center border border-t border-primary/30 bg-background/95 backdrop-blur rounded-none"
						: "rounded-full border border-border/60 bg-background/95 shadow-sm backdrop-blur hover:border-primary/40 mb-4",
				)}
				aria-label={
					isExpanded ? "Collapse debug console" : "Open debug console"
				}
			>
				<Bug className="h-3.5 w-3.5 text-primary" />
				<span className="uppercase tracking-wider">Debug</span>
				{isExpanded ? (
					<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
				) : (
					hasEvents && (
						<span className="ml-0.5 rounded-full border border-border/60 bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
							{events.length > 99 ? "99+" : events.length}
						</span>
					)
				)}
			</button>

			{/* Payload Detail Modal */}
			{selectedEvent && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
					onClick={() => setSelectedEvent(null)}
				>
					<div
						className="w-[min(90vw,800px)] max-h-[80vh] flex flex-col rounded-2xl border border-border/60 bg-background shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-muted/30 shrink-0 rounded-t-2xl">
							<div className="flex items-center gap-2.5">
								<span className="text-sm font-semibold text-foreground">
									{DEBUG_EVENT_META[selectedEvent.eventType].label}
								</span>
								<span
									className={cn(
										"rounded px-1.5 py-0.5 font-mono uppercase text-[9px] font-bold tracking-wider",
										selectedEvent.level === "error" &&
											"bg-destructive/20 text-destructive",
										selectedEvent.level === "warn" &&
											"bg-amber-500/20 text-amber-700 dark:text-amber-400",
										selectedEvent.level === "info" &&
											"bg-blue-500/20 text-blue-700 dark:text-blue-400",
										selectedEvent.level === "debug" &&
											"bg-muted text-muted-foreground",
									)}
								>
									{selectedEvent.level}
								</span>
							</div>
							<button
								type="button"
								onClick={() => setSelectedEvent(null)}
								className="rounded-lg p-1 hover:bg-muted transition-colors"
								aria-label="Close modal"
							>
								<X className="h-4 w-4 text-muted-foreground" />
							</button>
						</div>

						{/* Modal Body */}
						<div className="flex-1 overflow-y-auto p-4">
							<div className="space-y-3">
								<div>
									<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
										Message
									</span>
									<p className="text-sm text-foreground mt-1">
										{selectedEvent.message}
									</p>
								</div>

								<div>
									<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
										Timestamp
									</span>
									<p className="text-sm text-foreground font-mono mt-1">
										{new Date(selectedEvent.timestamp).toLocaleString()}
									</p>
								</div>

								{selectedEvent.requestId && (
									<div>
										<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
											Request ID
										</span>
										<p className="text-sm text-foreground font-mono mt-1">
											{selectedEvent.requestId}
										</p>
									</div>
								)}

								<div>
									<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
										Payload
									</span>
									<pre className="text-[11px] leading-relaxed text-foreground font-mono mt-1 p-3 rounded-lg bg-muted/30 border border-border/60 overflow-x-auto">
										{JSON.stringify(getPayloadData(selectedEvent), null, 2)}
									</pre>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
