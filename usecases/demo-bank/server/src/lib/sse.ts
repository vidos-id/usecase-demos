import type { Context } from "hono";

const encoder = new TextEncoder();

type RawSender = (eventName: string, payload: string) => void;

export type SseConnection = {
	sendRaw: RawSender;
	keepalive: () => void;
	close: () => void;
	onClose: (listener: () => void) => () => void;
};

export type TypedSseSender<T extends { eventType: string }> = {
	send: (event: T) => void;
};

function serializeSseChunk(eventName: string, payload: string): string {
	const safePayload = payload.replace(/\n/g, "\\n");
	return `event: ${eventName}\ndata: ${safePayload}\n\n`;
}

function serializeKeepaliveChunk(): string {
	return ": keepalive\n\n";
}

export function createTypedSseSender<T extends { eventType: string }>(
	sendRaw: RawSender,
	validate: (value: unknown) => T,
): TypedSseSender<T> {
	return {
		send: (event: T) => {
			const parsed = validate(event);
			sendRaw(parsed.eventType, JSON.stringify(parsed));
		},
	};
}

export function createSseResponse(
	c: Context,
	onConnect: (connection: SseConnection) => void | Promise<void>,
	keepaliveMs = 5000,
): Response {
	const streamPath = c.req.path;
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			let closed = false;
			const closeListeners = new Set<() => void>();

			console.info("[SSE][server] stream opened:", streamPath);

			const close = () => {
				if (closed) {
					return;
				}
				closed = true;
				console.info("[SSE][server] stream closed:", streamPath);
				for (const listener of closeListeners) {
					listener();
				}
				controller.close();
			};

			const sendRaw: RawSender = (eventName, payload) => {
				if (closed) {
					return;
				}
				console.debug("[SSE][server] event sent:", streamPath, eventName);
				controller.enqueue(
					encoder.encode(serializeSseChunk(eventName, payload)),
				);
			};

			const keepalive = () => {
				if (closed) {
					return;
				}
				console.debug("[SSE][server] keepalive sent:", streamPath);
				controller.enqueue(encoder.encode(serializeKeepaliveChunk()));
			};

			const keepaliveTimer = setInterval(() => {
				keepalive();
			}, keepaliveMs);

			const abortHandler = () => {
				console.info("[SSE][server] request aborted:", streamPath);
				close();
			};
			c.req.raw.signal.addEventListener("abort", abortHandler);

			const unsubscribeAbort = () => {
				c.req.raw.signal.removeEventListener("abort", abortHandler);
			};

			closeListeners.add(() => {
				clearInterval(keepaliveTimer);
				unsubscribeAbort();
			});

			void Promise.resolve(
				onConnect({
					sendRaw,
					keepalive,
					close,
					onClose: (listener) => {
						closeListeners.add(listener);
						return () => {
							closeListeners.delete(listener);
						};
					},
				}),
			).catch((error: unknown) => {
				console.error("[SSE][server] onConnect failed:", streamPath, error);
				close();
			});
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	});
}
