import { delegationClaimsSchema } from "ticket-agent-shared/types/delegation";
import { z } from "zod";
import {
	assignBookingUser,
	getBookingByAuthorizationId,
	updateBookingStatus,
} from "../stores/bookings";
import { getDelegationSessionById } from "../stores/delegation-sessions";
import { updateUserIdentity } from "../stores/users";
import { getDelegationCredentialStatusValue } from "./issuer";
import { getExtractedCredentials, pollAuthorizationStatus } from "./vidos";

const MONITOR_INTERVAL_MS = 2000;
const MONITOR_TIMEOUT_MS = 5 * 60 * 1000;

const pidClaimsSchema = z.object({
	given_name: z.string(),
	family_name: z.string(),
	birthdate: z.string(),
});

type MonitorType = "pid_verification" | "booking_verification";

interface MonitorContext {
	type: MonitorType;
	authorizationId: string;
	userId?: string;
	bookingId?: string;
	delegationSessionId?: string;
}

interface MonitorState {
	interval: ReturnType<typeof setInterval>;
	startedAt: number;
	running: boolean;
}

const monitors = new Map<string, MonitorState>();

export function startAuthorizationMonitor(context: MonitorContext): void {
	const key = context.authorizationId;
	if (monitors.has(key)) {
		console.warn("[Monitor] Already monitoring:", key);
		return;
	}

	console.log("[Monitor] Starting monitor:", key, "type:", context.type);

	const interval = setInterval(() => {
		void monitorTick(context);
	}, MONITOR_INTERVAL_MS);

	monitors.set(key, {
		interval,
		startedAt: Date.now(),
		running: false,
	});

	void monitorTick(context);
}

export function stopAuthorizationMonitor(authorizationId: string): void {
	const monitor = monitors.get(authorizationId);
	if (!monitor) {
		return;
	}

	clearInterval(monitor.interval);
	monitors.delete(authorizationId);
	console.log("[Monitor] Stopped monitor:", authorizationId);
}

async function monitorTick(context: MonitorContext): Promise<void> {
	const { authorizationId } = context;
	const monitor = monitors.get(authorizationId);
	if (!monitor || monitor.running) {
		return;
	}

	monitor.running = true;

	try {
		if (Date.now() - monitor.startedAt > MONITOR_TIMEOUT_MS) {
			console.log("[Monitor] Timeout reached:", authorizationId);
			stopAuthorizationMonitor(authorizationId);

			if (context.type === "booking_verification") {
				const bookingId =
					context.bookingId ?? getBookingByAuthorizationId(authorizationId)?.id;
				if (bookingId) {
					updateBookingStatus(bookingId, {
						status: "expired",
						errorMessage: "Verification timed out",
					});
				}
			}

			return;
		}

		const result = await pollAuthorizationStatus(authorizationId);
		if (result.status === "pending") {
			return;
		}

		stopAuthorizationMonitor(authorizationId);

		if (result.status === "authorized") {
			if (context.type === "pid_verification") {
				await handlePIDVerificationSuccess(context);
				return;
			}

			await handleBookingVerificationSuccess(context);
			return;
		}

		if (context.type === "booking_verification") {
			const bookingId =
				context.bookingId ?? getBookingByAuthorizationId(authorizationId)?.id;
			if (bookingId) {
				updateBookingStatus(bookingId, {
					status: result.status === "expired" ? "expired" : "rejected",
					errorMessage: result.error || `Verification ${result.status}`,
				});
			}
		}
	} catch (error) {
		console.error("[Monitor] Error polling:", authorizationId, error);
	} finally {
		const latest = monitors.get(authorizationId);
		if (latest) {
			latest.running = false;
		}
	}
}

async function handlePIDVerificationSuccess(
	context: MonitorContext,
): Promise<void> {
	if (!context.userId) {
		console.error("[Monitor] No userId for PID verification");
		return;
	}

	try {
		const claims = await getExtractedCredentials(
			context.authorizationId,
			pidClaimsSchema,
		);

		updateUserIdentity(context.userId, {
			givenName: claims.given_name,
			familyName: claims.family_name,
			birthDate: claims.birthdate,
		});

		console.log(
			"[Monitor] PID verification complete for user:",
			context.userId,
		);
	} catch (error) {
		console.error("[Monitor] Failed to extract PID claims:", error);
	}
}

async function handleBookingVerificationSuccess(
	context: MonitorContext,
): Promise<void> {
	const bookingId =
		context.bookingId ??
		getBookingByAuthorizationId(context.authorizationId)?.id;
	if (!bookingId) {
		console.error("[Monitor] No booking found for booking verification");
		return;
	}

	try {
		const claims = await getExtractedCredentials(
			context.authorizationId,
			delegationClaimsSchema,
		);

		if (!claims.delegation_scopes.includes("book_tickets")) {
			updateBookingStatus(bookingId, {
				status: "rejected",
				errorMessage:
					"Delegation credential does not include book_tickets scope",
			});
			return;
		}

		if (new Date(claims.valid_until) < new Date()) {
			updateBookingStatus(bookingId, {
				status: "rejected",
				errorMessage: "Delegation credential has expired",
			});
			return;
		}

		const delegationSession = getDelegationSessionById(claims.delegation_id);
		if (!delegationSession) {
			updateBookingStatus(bookingId, {
				status: "rejected",
				errorMessage: "Delegation session could not be resolved",
			});
			return;
		}

		if (!delegationSession.credentialStatus) {
			updateBookingStatus(bookingId, {
				status: "rejected",
				errorMessage: "Delegation credential status could not be resolved",
			});
			return;
		}

		const currentStatus = getDelegationCredentialStatusValue(
			delegationSession.credentialStatus,
		);
		if (currentStatus === 2) {
			updateBookingStatus(bookingId, {
				status: "rejected",
				errorMessage: "Delegation has been revoked by the user",
			});
			return;
		}

		if (currentStatus === 1) {
			updateBookingStatus(bookingId, {
				status: "rejected",
				errorMessage: "Delegation has been suspended by the user",
			});
			return;
		}

		const delegatorName = `${claims.given_name} ${claims.family_name}`;
		const agentName =
			delegationSession.agentName.trim() ||
			claims.agent_name.trim() ||
			"Unnamed Agent";
		assignBookingUser(bookingId, delegationSession.userId);
		updateBookingStatus(bookingId, {
			status: "confirmed",
			delegatorName,
			agentName,
			delegationSessionId: delegationSession.id,
			errorMessage: undefined,
		});

		console.log(
			"[Monitor] Booking confirmed:",
			bookingId,
			"delegator:",
			delegatorName,
			"agent:",
			agentName,
		);
	} catch (error) {
		console.error("[Monitor] Failed to verify delegation credential:", error);
		updateBookingStatus(bookingId, {
			status: "error",
			errorMessage: "Failed to verify delegation credential",
		});
	}
}
export function getActiveMonitorCount(): number {
	return monitors.size;
}
