import { describe, expect, test } from "bun:test";
import {
	businessChannelEventSchema,
	debugChannelEventSchema,
	debugSseEventSchema,
	sseChannelEventSchema,
} from "./debug-sse";

describe("debug SSE contracts", () => {
	test("parses a valid debug event", () => {
		const event = debugSseEventSchema.parse({
			eventType: "system",
			level: "info",
			timestamp: new Date().toISOString(),
			message: "Debug event ok",
			code: "ok",
		});

		expect(event.eventType).toBe("system");
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
				eventType: "system",
				level: "info",
				timestamp: new Date().toISOString(),
				message: "wrong channel",
			},
		});

		const debugResult = sseChannelEventSchema.safeParse({
			channel: "debug",
			event: {
				eventType: "system",
				level: "warn",
				timestamp: new Date().toISOString(),
				message: "debug-only",
			},
		});

		expect(businessResult.success).toBeFalse();
		expect(debugResult.success).toBeTrue();
	});
});
