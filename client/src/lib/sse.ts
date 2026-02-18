import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { buildApiUrl } from "./api-client";
import { getSessionId } from "./auth";

const STREAM_EVENT_NAMES = [
	"connected",
	"pending",
	"authorized",
	"expired",
	"not_found",
	"account_exists",
	"rejected",
	"error",
] as const;

type StreamEventName = (typeof STREAM_EVENT_NAMES)[number];

type UseTypedEventSourceOptions<TEvent> = {
	url: string | null;
	schema: z.ZodType<TEvent>;
	eventNames?: readonly string[];
	enabled?: boolean;
	onEvent: (event: TEvent, controls: { close: () => void }) => void;
	onParseError?: (error: Error) => void;
};

type UseTypedEventSourceState = {
	isConnected: boolean;
	hasEverConnected: boolean;
	error: string | null;
};

export function createStreamUrl(
	pathname: string,
	query?: Record<string, string | undefined>,
	withSession = false,
): string {
	const sessionId = withSession ? (getSessionId() ?? undefined) : undefined;
	return buildApiUrl(pathname, {
		...query,
		session_id: sessionId,
	});
}

export function useTypedEventSource<TEvent>(
	options: UseTypedEventSourceOptions<TEvent>,
): UseTypedEventSourceState {
	const {
		enabled = true,
		eventNames = STREAM_EVENT_NAMES,
		onEvent,
		onParseError,
		schema,
		url,
	} = options;
	const sourceRef = useRef<EventSource | null>(null);
	const onEventRef = useRef(onEvent);
	const onParseErrorRef = useRef(onParseError);
	const schemaRef = useRef(schema);
	const eventNamesRef = useRef(eventNames);
	const [isConnected, setIsConnected] = useState(false);
	const [hasEverConnected, setHasEverConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		onEventRef.current = onEvent;
	}, [onEvent]);

	useEffect(() => {
		onParseErrorRef.current = onParseError;
	}, [onParseError]);

	useEffect(() => {
		schemaRef.current = schema;
	}, [schema]);

	useEffect(() => {
		eventNamesRef.current = eventNames;
	}, [eventNames]);

	useEffect(() => {
		if (!enabled || !url) {
			sourceRef.current?.close();
			sourceRef.current = null;
			setIsConnected(false);
			return;
		}

		console.info("[SSE][client] opening stream:", url);
		const eventSource = new EventSource(url);
		sourceRef.current = eventSource;
		let closed = false;
		let hasConnected = false;
		let retryLogged = false;

		const close = () => {
			if (closed) {
				return;
			}
			closed = true;
			console.info("[SSE][client] closing stream:", url);
			eventSource.close();
			if (sourceRef.current === eventSource) {
				sourceRef.current = null;
			}
			setIsConnected(false);
		};

		const handleOpen = () => {
			console.info("[SSE][client] stream connected:", url);
			hasConnected = true;
			retryLogged = false;
			setIsConnected(true);
			setHasEverConnected(true);
			setError(null);
		};

		const handleError = () => {
			if (closed || eventSource.readyState === EventSource.CLOSED) {
				console.info("[SSE][client] stream closed:", url);
				return;
			}

			if (hasConnected && eventSource.readyState === EventSource.CONNECTING) {
				if (!retryLogged) {
					console.warn("[SSE][client] stream disconnected, retrying:", url);
					retryLogged = true;
				}
				setIsConnected(false);
				return;
			}

			console.error("[SSE][client] stream error:", url);
			setIsConnected(false);
			setError("stream_error");
		};

		const parseAndDispatch = (evt: Event) => {
			if (!(evt instanceof MessageEvent) || typeof evt.data !== "string") {
				return;
			}

			try {
				console.debug("[SSE][client] raw event received:", {
					url,
					eventType: evt.type,
					data: evt.data,
				});
				const parsedJson = JSON.parse(evt.data) as unknown;
				const parsed = schemaRef.current.parse(parsedJson);
				console.debug("[SSE][client] parsed event:", {
					url,
					eventType: evt.type,
					payload: parsed,
				});
				onEventRef.current(parsed, { close });
			} catch (err) {
				const parseError =
					err instanceof Error ? err : new Error("Failed to parse SSE payload");
				console.error("[SSE][client] parse error:", url, parseError);
				onParseErrorRef.current?.(parseError);
			}
		};

		eventSource.addEventListener("open", handleOpen);
		eventSource.addEventListener("error", handleError);

		for (const eventName of eventNamesRef.current) {
			eventSource.addEventListener(
				eventName,
				parseAndDispatch as EventListener,
			);
		}

		return () => {
			eventSource.removeEventListener("open", handleOpen);
			eventSource.removeEventListener("error", handleError);
			for (const eventName of eventNamesRef.current) {
				eventSource.removeEventListener(
					eventName,
					parseAndDispatch as EventListener,
				);
			}
			close();
		};
	}, [enabled, url]);

	return {
		isConnected,
		hasEverConnected,
		error,
	};
}

export type { StreamEventName };
