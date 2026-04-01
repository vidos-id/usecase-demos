import type { App } from "@modelcontextprotocol/ext-apps";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { POLL_INTERVAL_MS } from "../lib/constants";
import { isTerminalStatus, normalizeToolOutput } from "../lib/state";
import type {
	VerificationStatus,
	VerificationViewData,
	WidgetToolPayload,
} from "../lib/types";

export type WidgetViewState = {
	data: VerificationViewData;
	authorizeUrl: string;
	sessionId: string | null;
	status: VerificationStatus | undefined;
};

function extractViewState(raw: WidgetToolPayload): WidgetViewState {
	const normalized = normalizeToolOutput(raw);

	return {
		data: normalized,
		authorizeUrl:
			normalized.authorization?.authorizeUrl ?? normalized.authorizeUrl ?? "",
		sessionId: normalized.checkoutSessionId ?? null,
		status: normalized.status,
	};
}

export function useWidgetState(
	app: App | null,
	rawToolOutput: WidgetToolPayload,
) {
	const hostView = useMemo(
		() => extractViewState(rawToolOutput),
		[rawToolOutput],
	);
	const [view, setView] = useState<WidgetViewState>(hostView);

	useEffect(() => {
		if (!hostView.sessionId && !hostView.status) {
			return;
		}

		setView(hostView);
	}, [hostView]);

	const sessionId = view.sessionId;
	const isTerminal = isTerminalStatus(view.status);

	useQuery({
		queryKey: ["checkout-status", sessionId],
		queryFn: async () => {
			if (!app || !sessionId) {
				return null;
			}

			const raw = await app.callServerTool({
				name: "get_checkout_status",
				arguments: { checkoutSessionId: sessionId },
			});

			setView(extractViewState(raw));
			return null;
		},
		enabled: !!app && !!sessionId && !isTerminal,
		refetchInterval: POLL_INTERVAL_MS,
		refetchIntervalInBackground: true,
	});

	return view;
}
