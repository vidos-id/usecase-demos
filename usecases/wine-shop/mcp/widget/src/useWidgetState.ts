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
	qrSvg: string;
	authorizeUrl: string;
	sessionId: string | null;
};

const EMPTY_VIEW: WidgetViewState = {
	data: {},
	qrSvg: "",
	authorizeUrl: "",
	sessionId: null,
};

const STATUS_PRIORITY: Record<VerificationStatus, number> = {
	pending: 0,
	verification_required: 1,
	verifying: 2,
	verified: 3,
	rejected: 3,
	expired: 3,
	error: 3,
	completed: 4,
};

function mergeStatus(
	previousStatus: VerificationStatus | undefined,
	nextStatus: VerificationStatus | undefined,
): VerificationStatus | undefined {
	if (!previousStatus) {
		return nextStatus;
	}

	if (!nextStatus) {
		return previousStatus;
	}

	return STATUS_PRIORITY[nextStatus] >= STATUS_PRIORITY[previousStatus]
		? nextStatus
		: previousStatus;
}

function extractViewState(
	raw: WidgetToolPayload,
	previousView: WidgetViewState,
): WidgetViewState {
	const normalized = normalizeToolOutput(raw);
	const nextSessionId = normalized.checkoutSessionId ?? previousView.sessionId;
	const sameSession = nextSessionId === previousView.sessionId;
	const previousStatus = sameSession ? previousView.data.status : undefined;
	const nextStatus = mergeStatus(previousStatus, normalized.status);
	const previousVerification =
		sameSession &&
		isTerminalStatus(previousStatus) &&
		!isTerminalStatus(normalized.status)
			? previousView.data.verification
			: undefined;
	const data: VerificationViewData = {
		...(sameSession ? previousView.data : {}),
		...normalized,
		status: nextStatus,
		authorization:
			normalized.authorization ??
			(sameSession ? previousView.data.authorization : undefined),
		verification:
			normalized.verification ??
			previousVerification ??
			(sameSession ? previousView.data.verification : undefined),
	};

	return {
		data,
		qrSvg: data.qrSvg ?? (sameSession ? previousView.qrSvg : "") ?? "",
		authorizeUrl:
			data.authorization?.authorizeUrl ??
			data.authorizeUrl ??
			(sameSession ? previousView.authorizeUrl : "") ??
			"",
		sessionId: nextSessionId,
	};
}

export function useWidgetState(
	app: App | null,
	rawToolOutput: WidgetToolPayload,
) {
	const hostView = useMemo(
		() => extractViewState(rawToolOutput, EMPTY_VIEW),
		[rawToolOutput],
	);
	const [view, setView] = useState<WidgetViewState>(hostView);

	useEffect(() => {
		if (!hostView.sessionId) {
			setView((current) => extractViewState(rawToolOutput, current));
			return;
		}

		setView((current) => {
			if (current.sessionId && current.sessionId !== hostView.sessionId) {
				return hostView;
			}

			return extractViewState(rawToolOutput, current);
		});
	}, [hostView, rawToolOutput]);

	const sessionId = view.sessionId;
	const isTerminal = isTerminalStatus(view.data.status);

	useQuery({
		queryKey: ["checkout-status", sessionId, view.data.status],
		queryFn: async () => {
			if (!app || !sessionId) {
				return view;
			}

			const raw = await app.callServerTool({
				name: "get_checkout_status",
				arguments: {
					checkoutSessionId: sessionId,
				},
			});
			setView((current) => {
				if (current.sessionId !== sessionId) {
					return current;
				}

				return extractViewState(raw, current);
			});

			return null;
		},
		enabled: !!app && !!sessionId && !isTerminal,
		refetchInterval: POLL_INTERVAL_MS,
		refetchIntervalInBackground: true,
	});

	return view;
}
