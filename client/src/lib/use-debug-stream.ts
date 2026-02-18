import {
	type DebugSseEvent,
	debugSseEventNames,
	debugSseEventSchema,
} from "shared/api/debug-sse";
import { createStreamUrl, useTypedEventSource } from "./sse";

type UseDebugStreamOptions = {
	requestId: string | null;
	debugSessionId?: string;
	enabled?: boolean;
	onEvent: (event: DebugSseEvent, controls: { close: () => void }) => void;
	onParseError?: (error: Error) => void;
};

export function useDebugStream(options: UseDebugStreamOptions) {
	const {
		requestId,
		debugSessionId,
		enabled = true,
		onEvent,
		onParseError,
	} = options;

	const streamUrl = requestId
		? createStreamUrl(
				`/api/debug/stream/${requestId}`,
				{ debug_session_id: debugSessionId },
				true,
			)
		: null;

	return useTypedEventSource({
		url: streamUrl,
		schema: debugSseEventSchema,
		eventNames: debugSseEventNames,
		enabled: enabled && Boolean(streamUrl),
		onEvent,
		onParseError,
	});
}
