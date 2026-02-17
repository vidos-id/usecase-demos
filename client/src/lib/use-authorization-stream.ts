import {
	authorizationStreamEventNames,
	authorizationStreamEventSchema,
	type AuthorizationStreamEvent,
} from "shared/api/authorization-sse";
import { createStreamUrl, useTypedEventSource } from "./sse";

type UseAuthorizationStreamOptions = {
	requestId: string | null;
	streamPath?: string;
	getStreamUrl?: (requestId: string) => string;
	enabled?: boolean;
	withSession?: boolean;
	onEvent: (
		event: AuthorizationStreamEvent,
		controls: { close: () => void },
	) => void;
	onParseError?: (error: Error) => void;
};

export function useAuthorizationStream(options: UseAuthorizationStreamOptions) {
	const {
		requestId,
		streamPath,
		getStreamUrl,
		enabled = true,
		withSession = true,
		onEvent,
		onParseError,
	} = options;

	const streamUrl = requestId
		? getStreamUrl
			? getStreamUrl(requestId)
			: streamPath
				? createStreamUrl(`${streamPath}/${requestId}`, undefined, withSession)
				: null
		: null;

	return useTypedEventSource({
		url: streamUrl,
		schema: authorizationStreamEventSchema,
		eventNames: authorizationStreamEventNames,
		enabled: enabled && Boolean(streamUrl),
		onEvent,
		onParseError,
	});
}
