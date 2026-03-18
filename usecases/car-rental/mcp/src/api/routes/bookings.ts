import { z } from "zod";
import { failure, parseJsonBody, success } from "@/api/responses";
import { startAuthorizationMonitor } from "@/services/authorization-monitor";
import {
	createNonce,
	createVerificationSessionId,
	getBooking,
	selectCar,
	setVerification,
} from "@/services/booking-store";
import { createAuthorization } from "@/services/vidos-client";

const SelectBookingInputSchema = z.object({
	bookingSessionId: z.string().min(1),
	vehicleId: z.string().min(1),
});

const StartBookingInputSchema = z.object({
	bookingSessionId: z.string().min(1),
});

const BookingPathSchema = z.object({
	bookingSessionId: z.string().min(1),
});

const POLL_INTERVAL_SECONDS = 3;

export async function handleBookingRoutes(request: Request, pathname: string) {
	if (request.method === "POST" && pathname === "/api/bookings/select") {
		return handleSelectBooking(request);
	}

	if (request.method === "POST" && pathname === "/api/bookings/start") {
		return handleStartBooking(request);
	}

	const bookingMatch = pathname.match(/^\/api\/bookings\/([^/]+)$/);
	if (request.method === "GET" && bookingMatch) {
		return handleGetBooking(bookingMatch[1]!);
	}

	return failure("Not found.", 404);
}

async function handleSelectBooking(request: Request) {
	const parsed = await parseJsonBody(request, SelectBookingInputSchema);
	if (!parsed.success) {
		return parsed.response;
	}

	try {
		const booking = selectCar(
			parsed.data.bookingSessionId,
			parsed.data.vehicleId,
		);

		return success(
			`${booking.selectedVehicle?.name ?? "Vehicle"} selected. Continue with POST /api/bookings/start using the same bookingSessionId.`,
			{
				booking,
				nextStep:
					"Start booking to create the wallet verification request. Do not ask for licence details in chat.",
			},
		);
	} catch (error) {
		return failure(
			`Failed to select vehicle: ${error instanceof Error ? error.message : String(error)}`,
			400,
		);
	}
}

async function handleStartBooking(request: Request) {
	const parsed = await parseJsonBody(request, StartBookingInputSchema);
	if (!parsed.success) {
		return parsed.response;
	}

	try {
		const booking = getBooking(parsed.data.bookingSessionId);
		if (!booking.selectedVehicle || !booking.requirements) {
			return failure("Select a vehicle before starting booking.", 400);
		}

		const verificationSessionId = createVerificationSessionId();
		const authorization = await createAuthorization(createNonce());
		const verification = {
			verificationSessionId,
			authorizationId: authorization.authorizationId,
			authorizationUrl: authorization.authorizeUrl,
			lifecycle: "pending_wallet" as const,
			lastError: null,
			updatedAt: new Date().toISOString(),
		};

		const updated = setVerification(
			parsed.data.bookingSessionId,
			verification,
			"verification_required",
		);
		startAuthorizationMonitor(parsed.data.bookingSessionId);

		return success(
			`Booking started for ${booking.selectedVehicle.name}. Wallet verification is now required.`,
			{
				booking: updated,
				authorizeUrl: authorization.authorizeUrl ?? null,
				polling: {
					intervalSeconds: POLL_INTERVAL_SECONDS,
					path: `/api/bookings/${parsed.data.bookingSessionId}`,
				},
				instructions: authorization.authorizeUrl
					? {
							qrCode:
								"Generate a QR code from authorizeUrl with the Node package `qrcode`.",
							scan: "Ask the user to scan the QR code with their digital identity wallet.",
							directLink:
								"Also present the authorizeUrl in clickable form for phone users.",
							status:
								"Poll GET /api/bookings/:bookingSessionId until the booking becomes approved, rejected, expired, or error.",
						}
					: null,
			},
		);
	} catch (error) {
		return failure(
			`Failed to start booking: ${error instanceof Error ? error.message : String(error)}`,
			400,
		);
	}
}

function handleGetBooking(bookingSessionId: string) {
	const parsed = BookingPathSchema.safeParse({ bookingSessionId });
	if (!parsed.success) {
		return failure(`Invalid input: ${parsed.error.message}`, 400);
	}

	try {
		const booking = getBooking(parsed.data.bookingSessionId);
		const message =
			booking.status === "approved" && booking.confirmation
				? `Booking approved for ${booking.selectedVehicle?.name}. Pickup locker ${booking.confirmation.lockerId}, PIN ${booking.confirmation.lockerPin}.`
				: booking.status === "rejected" && booking.eligibility
					? `Booking rejected. ${booking.eligibility.reasonText}`
					: booking.status === "expired"
						? "Verification expired. Restart booking to issue a fresh wallet request."
						: booking.status === "error"
							? `Verification failed. ${booking.verification?.lastError ?? booking.eligibility?.reasonText ?? "Unknown authorizer error."}`
							: `Booking ${booking.bookingSessionId} is waiting for wallet verification.`;

		return success(message, { booking });
	} catch (error) {
		return failure(
			`Failed to get booking status: ${error instanceof Error ? error.message : String(error)}`,
			404,
		);
	}
}
