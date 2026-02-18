import { Hono } from "hono";
import {
	type CallbackSseState,
	callbackSseEventSchema,
} from "shared/api/callback-sse";
import {
	loanAuthMetadataSchema,
	paymentAuthMetadataSchema,
} from "shared/types/auth-metadata";
import { appEvents } from "../lib/events";
import { createSseResponse, createTypedSseSender } from "../lib/sse";
import { resolveResponseCode } from "../services/vidos";
import type { PendingAuthRequest } from "../stores/pending-auth-requests";
import { getPendingRequestByAuthId } from "../stores/pending-auth-requests";

function extractTransactionDetails(
	request: PendingAuthRequest,
): CallbackSseState["transactionDetails"] {
	if (!request.metadata) return undefined;

	if (request.type === "payment") {
		const parsed = paymentAuthMetadataSchema.safeParse(request.metadata);
		if (!parsed.success) return undefined;
		return {
			type: "payment",
			recipient: parsed.data.recipient,
			amount: Number(parsed.data.amount),
			reference: parsed.data.reference,
		};
	}

	if (request.type === "loan") {
		const parsed = loanAuthMetadataSchema.safeParse(request.metadata);
		if (!parsed.success) return undefined;
		return {
			type: "loan",
			loanAmount: Number(parsed.data.amount),
			loanPurpose: parsed.data.purpose,
			loanTerm: Number(parsed.data.term),
		};
	}

	return undefined;
}

function toCallbackStatus(request: PendingAuthRequest): {
	status: "pending" | "completed" | "failed";
	vidosStatus?: CallbackSseState["vidosStatus"];
} {
	if (request.status === "pending") {
		return { status: "pending" };
	}
	if (request.status === "completed") {
		return { status: "completed" };
	}
	if (request.status === "expired") {
		return { status: "failed", vidosStatus: "expired" };
	}
	if (request.result?.status === "rejected") {
		return { status: "failed", vidosStatus: "rejected" };
	}
	if (request.result?.status === "error") {
		return { status: "failed", vidosStatus: "error" };
	}
	return { status: "failed" };
}

function buildState(
	request: PendingAuthRequest,
	responseCode: string,
	authorizationId: string,
	fallbackVidosStatus?: CallbackSseState["vidosStatus"],
): CallbackSseState {
	const base = toCallbackStatus(request);
	const errorInfo = request.result?.errorInfo
		? {
				title: request.result.errorInfo.title,
				detail: request.result.errorInfo.detail,
				errorType: request.result.errorInfo.errorType,
			}
		: request.result?.error
			? {
					title: "Verification Failed",
					detail: request.result.error,
				}
			: undefined;

	return {
		responseCode,
		authorizationId,
		status: base.status,
		vidosStatus: base.vidosStatus ?? fallbackVidosStatus,
		flowType: request.type,
		completedAt: request.completedAt?.toISOString() ?? null,
		transactionDetails: extractTransactionDetails(request),
		errorInfo,
	};
}

function toCallbackStateEvent(
	state: CallbackSseState,
): ReturnType<typeof callbackSseEventSchema.parse> {
	if (state.status === "completed") {
		return callbackSseEventSchema.parse({
			eventType: "completed",
			...state,
		});
	}
	if (state.status === "failed") {
		return callbackSseEventSchema.parse({
			eventType: "failed",
			...state,
		});
	}
	return callbackSseEventSchema.parse({
		eventType: "pending",
		...state,
	});
}

export const callbackRouter = new Hono().get("/stream", (c) => {
	return createSseResponse(c, async (connection) => {
		const sender = createTypedSseSender(connection.sendRaw, (value) =>
			callbackSseEventSchema.parse(value),
		);

		const responseCode = c.req.query("response_code");
		if (!responseCode) {
			sender.send({
				eventType: "error",
				code: "missing_response_code",
				message: "response_code is required",
			});
			connection.close();
			return;
		}

		let resolved: Awaited<ReturnType<typeof resolveResponseCode>>;
		try {
			resolved = await resolveResponseCode(responseCode);
		} catch {
			sender.send({
				eventType: "error",
				responseCode,
				code: "invalid_response_code",
				message: "Invalid or expired response code",
			});
			connection.close();
			return;
		}

		const pendingRequest = getPendingRequestByAuthId(resolved.authorizationId);
		if (!pendingRequest) {
			sender.send({
				eventType: "error",
				responseCode,
				code: "authorization_not_found",
				message: "Authorization not found in system",
			});
			connection.close();
			return;
		}

		const initialState = buildState(
			pendingRequest,
			responseCode,
			resolved.authorizationId,
			resolved.status,
		);
		sender.send({
			eventType: "connected",
		});

		const initialEvent = toCallbackStateEvent(initialState);
		sender.send(initialEvent);

		if (initialEvent.eventType !== "pending") {
			connection.close();
			return;
		}

		const listener = (payload: {
			authorizationId: string;
			event: { eventType: string };
		}) => {
			if (payload.authorizationId !== resolved.authorizationId) {
				return;
			}

			const latest = getPendingRequestByAuthId(resolved.authorizationId);
			if (!latest) {
				sender.send({
					eventType: "error",
					responseCode,
					code: "authorization_not_found",
					message: "Authorization not found in system",
				});
				connection.close();
				return;
			}

			const state = buildState(
				latest,
				responseCode,
				resolved.authorizationId,
				resolved.status,
			);
			const stateEvent = toCallbackStateEvent(state);
			sender.send(stateEvent);
			if (stateEvent.eventType !== "pending") {
				connection.close();
			}
		};

		appEvents.on("authorizationRequestEvent", listener);
		connection.onClose(() => {
			appEvents.off("authorizationRequestEvent", listener);
		});
	});
});
