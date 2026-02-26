import {
	callbackSseEventNames,
	callbackSseEventSchema,
	type CallbackSseEvent,
} from "demo-bank-shared/api/callback-sse";
import { createStreamUrl, useTypedEventSource } from "./sse";

type UseCallbackStreamOptions = {
	responseCode: string | null;
	retryCount?: number;
	enabled?: boolean;
	onEvent: (event: CallbackSseEvent, controls: { close: () => void }) => void;
	onParseError?: (error: Error) => void;
};

export function useCallbackStream(options: UseCallbackStreamOptions) {
	const {
		responseCode,
		retryCount = 0,
		enabled = true,
		onEvent,
		onParseError,
	} = options;

	const streamUrl = responseCode
		? createStreamUrl("/api/callback/stream", {
				response_code: responseCode,
				retry: retryCount.toString(),
			})
		: null;

	return useTypedEventSource({
		url: streamUrl,
		schema: callbackSseEventSchema,
		eventNames: callbackSseEventNames,
		enabled: enabled && Boolean(streamUrl),
		onEvent,
		onParseError,
	});
}
