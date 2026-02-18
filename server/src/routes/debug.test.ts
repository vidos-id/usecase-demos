import { beforeEach, describe, expect, test } from "bun:test";
import type { DebugSseEvent } from "shared/api/debug-sse";
import { emitDebugEvent } from "../lib/debug-events";
import {
	clearAllPendingRequests,
	createPendingRequest,
	updateRequestToCompleted,
	updateRequestToExpired,
	updateRequestToFailed,
} from "../stores/pending-auth-requests";
import { clearAllSessions, createSession } from "../stores/sessions";
import { clearAllUsers, createUser } from "../stores/users";
import { debugRouter } from "./debug";

type SseRecord = {
	eventName: string;
	event: DebugSseEvent;
};

type Reader = {
	read: () => Promise<{ done: boolean; value?: Uint8Array }>;
	cancel: (reason?: unknown) => Promise<void>;
};

const TERMINAL_STATUSES = ["authorized", "rejected", "error", "expired"];

const readSseEvents = async (
	reader: Reader,
	maxEvents: number,
	timeoutMs = 1500,
): Promise<SseRecord[]> => {
	const decoder = new TextDecoder();
	const events: SseRecord[] = [];
	let buffer = "";

	while (events.length < maxEvents) {
		const readResult = await Promise.race([
			reader.read(),
			new Promise<never>((_, reject) => {
				setTimeout(() => reject(new Error("SSE read timeout")), timeoutMs);
			}),
		]);

		if (readResult.done) {
			break;
		}

		buffer += decoder.decode(readResult.value, { stream: true });
		const chunks = buffer.split("\n\n");
		buffer = chunks.pop() ?? "";

		for (const chunk of chunks) {
			const trimmed = chunk.trim();
			if (!trimmed || trimmed.startsWith(":")) {
				continue;
			}

			const eventLine = trimmed
				.split("\n")
				.find((line) => line.startsWith("event: "));
			const dataLine = trimmed
				.split("\n")
				.find((line) => line.startsWith("data: "));

			if (!eventLine || !dataLine) {
				continue;
			}

			events.push({
				eventName: eventLine.slice(7),
				event: JSON.parse(dataLine.slice(6)) as DebugSseEvent,
			});
			if (events.length >= maxEvents) {
				break;
			}
		}
	}

	return events;
};

const waitForStreamClose = async (
	reader: Reader,
	timeoutMs = 2000,
): Promise<boolean> => {
	const started = Date.now();
	while (Date.now() - started < timeoutMs) {
		const result = await Promise.race([
			reader.read(),
			new Promise<{ done: false; value: Uint8Array }>((resolve) => {
				setTimeout(
					() => resolve({ done: false, value: new Uint8Array() }),
					120,
				);
			}),
		]);
		if (result.done) {
			return true;
		}
	}
	return false;
};

beforeEach(() => {
	clearAllPendingRequests();
	clearAllSessions();
	clearAllUsers();
});

describe("debug SSE route", () => {
	test("isolates by request ownership and session", async () => {
		const userA = createUser({
			identifier: "user-a",
			familyName: "User",
			givenName: "A",
			birthDate: "1990-01-01",
			nationality: "EU",
		});
		const userB = createUser({
			identifier: "user-b",
			familyName: "User",
			givenName: "B",
			birthDate: "1990-01-02",
			nationality: "EU",
		});

		const sessionA = createSession({ userId: userA.id, mode: "direct_post" });
		const sessionB = createSession({ userId: userB.id, mode: "direct_post" });

		const requestA = createPendingRequest({
			vidosAuthorizationId: "auth-a",
			type: "payment",
			mode: "direct_post",
			metadata: {
				userId: userA.id,
				transactionId: "txn-a",
				recipient: "Merchant A",
				amount: "10.00",
				reference: "A",
			},
		});
		const requestB = createPendingRequest({
			vidosAuthorizationId: "auth-b",
			type: "payment",
			mode: "direct_post",
			metadata: {
				userId: userB.id,
				transactionId: "txn-b",
				recipient: "Merchant B",
				amount: "12.00",
				reference: "B",
			},
		});

		const forbiddenResponse = await debugRouter.request(
			`/stream/${requestA.id}?session_id=${sessionB.id}`,
		);
		expect(forbiddenResponse.status).toBe(403);

		const response = await debugRouter.request(
			`/stream/${requestA.id}?session_id=${sessionA.id}`,
		);
		expect(response.status).toBe(200);
		expect(response.body).not.toBeNull();
		if (!response.body) {
			throw new Error("Missing stream body");
		}
		const reader = response.body.getReader() as Reader;

		emitDebugEvent(
			{ requestId: requestB.id, flowType: requestB.type },
			{
				eventType: "system",
				level: "info",
				message: "requestB-event",
				code: "isolation",
			},
		);
		emitDebugEvent(
			{ requestId: requestA.id, flowType: requestA.type },
			{
				eventType: "system",
				level: "info",
				message: "requestA-event",
				code: "isolation",
			},
		);

		const events = await readSseEvents(reader, 3);
		await reader.cancel();

		expect(
			events.some((entry) => entry.event.message === "requestA-event"),
		).toBe(true);
		expect(
			events.some((entry) => entry.event.message === "requestB-event"),
		).toBe(false);
		expect(events.every((entry) => entry.event.requestId === requestA.id)).toBe(
			true,
		);
	});

	for (const status of TERMINAL_STATUSES) {
		test(`closes stream on terminal status: ${status}`, async () => {
			const request = createPendingRequest({
				vidosAuthorizationId: `terminal-${status}`,
				type: "signin",
				mode: "direct_post",
			});

			const response = await debugRouter.request(`/stream/${request.id}`);
			expect(response.status).toBe(200);
			expect(response.body).not.toBeNull();
			if (!response.body) {
				throw new Error("Missing stream body");
			}
			const reader = response.body.getReader() as Reader;

			await readSseEvents(reader, 2);

			if (status === "authorized") {
				updateRequestToCompleted(request.id, { sub: "ok" }, "session-id", {
					status: "authorized",
				});
			} else if (status === "rejected") {
				updateRequestToFailed(
					request.id,
					"Rejected",
					{
						errorType: "invalid_request",
						title: "Rejected",
						detail: "Rejected",
					},
					{ status: "rejected" },
				);
			} else if (status === "error") {
				updateRequestToFailed(request.id, "Error", undefined, {
					status: "error",
				});
			} else {
				updateRequestToExpired(request.id, { status: "expired" });
			}

			const closed = await waitForStreamClose(reader);
			expect(closed).toBe(true);
		});
	}

	test("replays buffered history in order for late subscribers", async () => {
		const request = createPendingRequest({
			vidosAuthorizationId: "replay-1",
			type: "signin",
			mode: "direct_post",
		});

		emitDebugEvent(
			{ requestId: request.id, flowType: request.type },
			{
				eventType: "system",
				level: "info",
				message: "history-1",
				code: "replay",
			},
		);
		emitDebugEvent(
			{ requestId: request.id, flowType: request.type },
			{
				eventType: "system",
				level: "info",
				message: "history-2",
				code: "replay",
			},
		);

		const response = await debugRouter.request(`/stream/${request.id}`);
		expect(response.status).toBe(200);
		expect(response.body).not.toBeNull();
		if (!response.body) {
			throw new Error("Missing stream body");
		}
		const reader = response.body.getReader() as Reader;

		const replayEvents = await readSseEvents(reader, 4);
		const replayMessages = replayEvents.map((entry) => entry.event.message);
		expect(replayMessages.includes("history-1")).toBe(true);
		expect(replayMessages.includes("history-2")).toBe(true);
		expect(replayMessages.indexOf("history-1")).toBeLessThan(
			replayMessages.indexOf("history-2"),
		);

		emitDebugEvent(
			{ requestId: request.id, flowType: request.type },
			{
				eventType: "system",
				level: "info",
				message: "live-1",
				code: "replay",
			},
		);

		const liveEvents = await readSseEvents(reader, 1);
		await reader.cancel();
		expect(liveEvents[0]?.event.message).toBe("live-1");
	});

	test("authorizes signin/signup debug stream with debug_session_id query and rejects mismatches", async () => {
		const signinRequest = createPendingRequest({
			vidosAuthorizationId: "signin-scoped",
			type: "signin",
			mode: "direct_post",
			debugScope: {
				ownerSessionId: "guest-session-signin",
			},
		});

		const signupRequest = createPendingRequest({
			vidosAuthorizationId: "signup-scoped",
			type: "signup",
			mode: "direct_post",
			debugScope: {
				ownerSessionId: "guest-session-signup",
			},
		});

		const signinUnauthorized = await debugRouter.request(
			`/stream/${signinRequest.id}`,
		);
		expect(signinUnauthorized.status).toBe(401);

		const signinForbidden = await debugRouter.request(
			`/stream/${signinRequest.id}?debug_session_id=wrong-session`,
		);
		expect(signinForbidden.status).toBe(401);

		const signinAllowed = await debugRouter.request(
			`/stream/${signinRequest.id}?debug_session_id=guest-session-signin`,
		);
		expect(signinAllowed.status).toBe(200);
		if (!signinAllowed.body) {
			throw new Error("Missing stream body");
		}
		await (signinAllowed.body.getReader() as Reader).cancel();

		const signupUnauthorized = await debugRouter.request(
			`/stream/${signupRequest.id}`,
		);
		expect(signupUnauthorized.status).toBe(401);

		const signupAllowed = await debugRouter.request(
			`/stream/${signupRequest.id}?debug_session_id=guest-session-signup`,
		);
		expect(signupAllowed.status).toBe(200);
		if (!signupAllowed.body) {
			throw new Error("Missing stream body");
		}
		await (signupAllowed.body.getReader() as Reader).cancel();

		const signupForbidden = await debugRouter.request(
			`/stream/${signupRequest.id}?debug_session_id=wrong-session`,
		);
		expect(signupForbidden.status).toBe(401);
	});

	test("delivers immediate live event after replay handoff", async () => {
		const request = createPendingRequest({
			vidosAuthorizationId: "replay-handoff",
			type: "signin",
			mode: "direct_post",
		});

		for (let index = 0; index < 30; index += 1) {
			emitDebugEvent(
				{ requestId: request.id, flowType: request.type },
				{
					eventType: "system",
					level: "info",
					message: `history-${index}`,
					code: "handoff",
				},
			);
		}

		const response = await debugRouter.request(`/stream/${request.id}`);
		expect(response.status).toBe(200);
		expect(response.body).not.toBeNull();
		if (!response.body) {
			throw new Error("Missing stream body");
		}

		emitDebugEvent(
			{ requestId: request.id, flowType: request.type },
			{
				eventType: "system",
				level: "info",
				message: "live-after-open",
				code: "handoff",
			},
		);

		const reader = response.body.getReader() as Reader;
		const events = await readSseEvents(reader, 33);
		await reader.cancel();

		const messages = events
			.map((entry) => entry.event.message)
			.filter((value): value is string => typeof value === "string");
		expect(messages.includes("live-after-open")).toBe(true);
	});
});
