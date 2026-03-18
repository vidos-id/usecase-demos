import type { BookingSnapshot } from "../../src/schemas/booking";
import type { RentalWidgetData } from "./types";

export const POLL_INTERVAL_MS = 2000;

export function normalizeToolOutput(raw: unknown): RentalWidgetData {
	if (!raw || typeof raw !== "object") {
		return {};
	}
	if (
		"structuredContent" in raw &&
		raw.structuredContent &&
		typeof raw.structuredContent === "object"
	) {
		return raw.structuredContent as RentalWidgetData;
	}
	return raw as RentalWidgetData;
}

export function isTerminal(booking: BookingSnapshot | undefined): boolean {
	return booking
		? ["approved", "rejected", "expired", "error"].includes(booking.status)
		: false;
}

export function buildResumeMessage(booking: BookingSnapshot): string {
	if (booking.status === "approved") {
		return `Verification succeeded for booking ${booking.bookingSessionId}. Please continue and confirm the car rental pickup details.`;
	}
	if (booking.status === "rejected") {
		return `Verification ended in rejection for booking ${booking.bookingSessionId}. Please explain the failure to the user.`;
	}
	if (booking.status === "expired") {
		return `Verification expired for booking ${booking.bookingSessionId}. Please tell the user a new verification is required.`;
	}
	return `Verification hit an error for booking ${booking.bookingSessionId}. Please explain the error and next step.`;
}
