import { describe, expect, test } from "bun:test";
import {
	businessChannelEventSchema,
	debugChannelEventSchema,
	debugSseEventSchema,
	sseChannelEventSchema,
} from "./debug-sse";

describe("debug SSE contracts", () => {
	test("parses a valid error debug event", () => {
		const event = debugSseEventSchema.parse({
			eventType: "error",
			level: "error",
			timestamp: new Date().toISOString(),
			message: "Debug event ok",
			code: "ok",
		});

		expect(event.eventType).toBe("error");
	});

	test("parses a valid vidos_request event", () => {
		const event = debugSseEventSchema.parse({
			eventType: "vidos_request",
			level: "info",
			timestamp: new Date().toISOString(),
			message: "→ Vidos: createAuthorization",
			operation: "createAuthorization",
			method: "POST",
			url: "/openid4/vp/v1_0/authorizations",
		});

		expect(event.eventType).toBe("vidos_request");
	});

	test("rejects unknown event types", () => {
		const result = debugSseEventSchema.safeParse({
			eventType: "system",
			level: "info",
			timestamp: new Date().toISOString(),
			message: "old event type",
		});

		expect(result.success).toBeFalse();
	});

	test("rejects business payload on debug channel", () => {
		const result = debugChannelEventSchema.safeParse({
			channel: "debug",
			event: {
				eventType: "authorized",
				sessionId: "session-1",
			},
		});

		expect(result.success).toBeFalse();
	});

	test("enforces channel separation for all SSE contracts", () => {
		const businessResult = businessChannelEventSchema.safeParse({
			channel: "authorization",
			event: {
				eventType: "error",
				level: "info",
				timestamp: new Date().toISOString(),
				message: "wrong channel",
			},
		});

		const debugResult = sseChannelEventSchema.safeParse({
			channel: "debug",
			event: {
				eventType: "error",
				level: "warn",
				timestamp: new Date().toISOString(),
				message: "debug-only",
			},
		});

		expect(businessResult.success).toBeFalse();
		expect(debugResult.success).toBeTrue();
	});
});
