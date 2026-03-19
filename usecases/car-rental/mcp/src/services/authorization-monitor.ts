import {
	createPickupConfirmation,
	finalizeEligibility,
	getBooking,
	setVerification,
} from "@/services/booking-store";
import { evaluateEligibility } from "@/services/eligibility";
import {
	type AuthorizerStatus,
	getAuthorizationStatus,
	getCredentials,
} from "@/services/vidos-client";
import type { RentalEligibility } from "@/types";

const MONITOR_INTERVAL_MS = 2000;

const monitors = new Map<string, ReturnType<typeof setInterval>>();

const TERMINAL_STATES: AuthorizerStatus[] = [
	"authorized",
	"completed",
	"success",
	"rejected",
	"expired",
	"error",
];

function isTerminal(status: AuthorizerStatus) {
	return TERMINAL_STATES.includes(status);
}

export function startAuthorizationMonitor(bookingSessionId: string) {
	if (monitors.has(bookingSessionId)) {
		return;
	}
	const interval = setInterval(() => {
		void monitorTick(bookingSessionId);
	}, MONITOR_INTERVAL_MS);
	monitors.set(bookingSessionId, interval);
	void monitorTick(bookingSessionId);
}

export function stopAuthorizationMonitor(bookingSessionId: string) {
	const interval = monitors.get(bookingSessionId);
	if (!interval) {
		return;
	}
	clearInterval(interval);
	monitors.delete(bookingSessionId);
}

function buildFailure(
	status: "verification_rejected" | "verification_expired" | "authorizer_error",
	vehicleName: string,
	minimumAge: number,
	requiredLicenceCategory: string,
): RentalEligibility {
	return {
		bookingApproved: false,
		minimumAge,
		minimumAgeMet: true,
		requiredLicenceCategory:
			requiredLicenceCategory as RentalEligibility["requiredLicenceCategory"],
		presentedCategories: [],
		licenceValid: false,
		reasonCode: status,
		reasonText:
			status === "verification_rejected"
				? `Wallet verification was rejected before ${vehicleName} could be approved.`
				: status === "verification_expired"
					? `Wallet verification expired before ${vehicleName} could be approved.`
					: `Authorizer error prevented approval for ${vehicleName}.`,
	};
}

async function monitorTick(bookingSessionId: string) {
	const booking = getBooking(bookingSessionId);
	const verification = booking.verification;
	if (!verification?.authorizationId || !booking.selectedVehicle) {
		stopAuthorizationMonitor(bookingSessionId);
		return;
	}

	if (
		["success", "rejected", "expired", "error"].includes(verification.lifecycle)
	) {
		stopAuthorizationMonitor(bookingSessionId);
		return;
	}

	try {
		const status = await getAuthorizationStatus(verification.authorizationId);
		if (!isTerminal(status)) {
			setVerification(
				bookingSessionId,
				{
					...verification,
					lifecycle:
						status === "pending_wallet" ? "pending_wallet" : "processing",
					updatedAt: new Date().toISOString(),
				},
				"verification_in_progress",
			);
			return;
		}

		if (["authorized", "completed", "success"].includes(status)) {
			const credentials = await getCredentials(verification.authorizationId);
			const eligibility = evaluateEligibility(
				booking.selectedVehicle,
				credentials,
			);
			setVerification(
				bookingSessionId,
				{
					...verification,
					lifecycle: "success",
					updatedAt: new Date().toISOString(),
				},
				eligibility.bookingApproved ? "approved" : "rejected",
			);
			finalizeEligibility(
				bookingSessionId,
				eligibility,
				eligibility.bookingApproved ? createPickupConfirmation(booking) : null,
			);
			stopAuthorizationMonitor(bookingSessionId);
			return;
		}

		const reasonCode =
			status === "rejected"
				? "verification_rejected"
				: status === "expired"
					? "verification_expired"
					: "authorizer_error";
		const eligibility = buildFailure(
			reasonCode,
			booking.selectedVehicle.name,
			booking.selectedVehicle.minimumDriverAge,
			booking.selectedVehicle.requiredLicenceCategory,
		);
		setVerification(
			bookingSessionId,
			{
				...verification,
				lifecycle:
					status === "rejected"
						? "rejected"
						: status === "expired"
							? "expired"
							: "error",
				lastError: eligibility.reasonText,
				updatedAt: new Date().toISOString(),
			},
			status === "expired"
				? "expired"
				: status === "error"
					? "error"
					: "rejected",
		);
		finalizeEligibility(bookingSessionId, eligibility, null);
		stopAuthorizationMonitor(bookingSessionId);
	} catch (error) {
		setVerification(
			bookingSessionId,
			{
				...verification,
				lifecycle: "error",
				lastError:
					error instanceof Error
						? error.message
						: "Authorization monitoring failed",
				updatedAt: new Date().toISOString(),
			},
			"error",
		);
		finalizeEligibility(
			bookingSessionId,
			buildFailure(
				"authorizer_error",
				booking.selectedVehicle.name,
				booking.selectedVehicle.minimumDriverAge,
				booking.selectedVehicle.requiredLicenceCategory,
			),
			null,
		);
		stopAuthorizationMonitor(bookingSessionId);
	}
}
