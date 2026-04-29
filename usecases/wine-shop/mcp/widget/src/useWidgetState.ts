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

		setView((prev) => ({
			...hostView,
			// Preserve top-level authorizeUrl and merge data so fields the host omits
			// (authorization, authorizeUrl, statusPollUrl) survive across get_checkout_status
			// ontoolresult pushes. Without this, polling responses wipe the QR source.
			authorizeUrl: hostView.authorizeUrl || prev.authorizeUrl,
			data: {
				...prev.data,
				...hostView.data,
			},
		}));
	}, [hostView]);

	const sessionId = view.sessionId;
	const isTerminal = isTerminalStatus(view.status);

	const statusPollUrl = view.data.statusPollUrl;

	useQuery({
		queryKey: ["checkout-status", sessionId],
		queryFn: async () => {
			if (!sessionId) return null;

			// Primary: direct HTTP poll — works in Claude.ai where callServerTool is unsupported
			if (statusPollUrl) {
				try {
					const res = await fetch(statusPollUrl);
					if (res.ok) {
						const envelope = await res.json();
						const data = envelope?.data ?? envelope;
						setView((prev) => extractViewState({ ...prev.data, ...data }));
						return null;
					}
				} catch {
					// fall through to callServerTool
				}
			}

			// Fallback: callServerTool — works in ChatGPT / hosts that support ext-apps bridge
			if (!app) return null;
			const raw = await app.callServerTool({
				name: "get_checkout_status",
				arguments: { checkoutSessionId: sessionId },
			});
			// Merge with prev.data so authorizeUrl/authorization survive — get_checkout_status
			// responses don't include them, mirroring the HTTP poll path above.
			setView((prev) =>
				extractViewState({ ...prev.data, ...normalizeToolOutput(raw) }),
			);
			return null;
		},
		enabled: !!sessionId && !isTerminal,
		refetchInterval: POLL_INTERVAL_MS,
		refetchIntervalInBackground: true,
	});

	return view;
}
