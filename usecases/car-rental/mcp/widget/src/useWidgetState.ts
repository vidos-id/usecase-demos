import type { App } from "@modelcontextprotocol/ext-apps";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	isTerminal,
	normalizeToolOutput,
	POLL_INTERVAL_MS,
} from "../lib/state";
import type { RentalWidgetData, WidgetToolPayload } from "../lib/types";

export function useWidgetState(
	app: App | null,
	rawToolOutput: WidgetToolPayload,
) {
	const [view, setView] = useState<RentalWidgetData>(() =>
		normalizeToolOutput(rawToolOutput),
	);

	useEffect(() => {
		setView((current) => ({
			...current,
			...normalizeToolOutput(rawToolOutput),
		}));
	}, [rawToolOutput]);

	const bookingSessionId = view.booking?.bookingSessionId;

	useQuery({
		queryKey: ["booking-status", bookingSessionId, view.booking?.status],
		queryFn: async () => {
			if (!app || !bookingSessionId) {
				return null;
			}
			const raw = await app.callServerTool({
				name: "get_booking_status",
				arguments: { bookingSessionId },
			});
			setView((current) => ({ ...current, ...normalizeToolOutput(raw) }));
			return null;
		},
		enabled: Boolean(app && bookingSessionId && !isTerminal(view.booking)),
		refetchInterval: POLL_INTERVAL_MS,
		refetchIntervalInBackground: true,
	});

	return view;
}
