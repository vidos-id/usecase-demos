import type { Context } from "hono";
import {
	authorizationStreamEventSchema,
	type AuthorizationFlowType,
} from "shared/api/authorization-sse";
import { createSseResponse, createTypedSseSender } from "../lib/sse";
import { appEvents } from "../lib/events";
import {
	getAuthorizationStreamStateByRequestId,
	getPendingRequestById,
	type PendingAuthRequest,
} from "../stores/pending-auth-requests";

type AuthResult =
	| { ok: true }
	| { ok: false; status: 401 | 403; message: string };

type AuthorizationStreamOptions = {
	flowType: AuthorizationFlowType;
	authorize: (
		c: Context,
		pendingRequest: PendingAuthRequest,
	) => AuthResult | Promise<AuthResult>;
};

export function streamAuthorizationRequest(
	c: Context,
	options: AuthorizationStreamOptions,
): Response {
	const requestId = c.req.param("requestId");
	const pendingRequest = getPendingRequestById(requestId);
	if (!pendingRequest || pendingRequest.type !== options.flowType) {
		return c.json({ error: "Request not found" }, 404);
	}

	return createSseResponse(c, async (connection) => {
		const sender = createTypedSseSender(connection.sendRaw, (value) =>
			authorizationStreamEventSchema.parse(value),
		);

		const authResult = await options.authorize(c, pendingRequest);
		if (!authResult.ok) {
			sender.send({
				eventType: "error",
				code: authResult.status === 401 ? "unauthorized" : "forbidden",
				message: authResult.message,
			});
			connection.close();
			return;
		}

		const currentState = getAuthorizationStreamStateByRequestId(requestId);
		if (!currentState) {
			sender.send({
				eventType: "error",
				code: "not_found",
				message: "Request not found",
			});
			connection.close();
			return;
		}

		sender.send({
			eventType: "connected",
		});

		if (
			currentState.eventType !== "connected" &&
			currentState.eventType !== "pending"
		) {
			sender.send(currentState);
			connection.close();
			return;
		}

		const listener = (payload: {
			requestId: string;
			event: ReturnType<typeof authorizationStreamEventSchema.parse>;
		}) => {
			if (payload.requestId !== requestId) {
				return;
			}
			sender.send(payload.event);
			if (
				payload.event.eventType !== "connected" &&
				payload.event.eventType !== "pending"
			) {
				connection.close();
			}
		};

		appEvents.on("authorizationRequestEvent", listener);
		connection.onClose(() => {
			appEvents.off("authorizationRequestEvent", listener);
		});
	});
}
