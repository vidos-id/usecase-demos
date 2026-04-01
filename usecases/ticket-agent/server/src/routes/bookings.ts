import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	bookingInspectionResponseSchema,
	createBookingRequestSchema,
} from "ticket-agent-shared/api/bookings";
import { getEventById } from "ticket-agent-shared/lib/events";
import { startAuthorizationMonitor } from "../services/authorization-monitor";
import {
	createDelegationAuthorizationRequest,
	getAuthorizationInspectionDetails,
} from "../services/vidos";
import {
	createBooking,
	getBookingById,
	getBookingByStatusToken,
	getBookingsByUserId,
} from "../stores/bookings";
import {
	getAuthenticatedUserIfPresent,
	requireAuthenticatedUser,
} from "./auth";

function serializeBooking(
	booking: NonNullable<ReturnType<typeof getBookingById>>,
) {
	const event = getEventById(booking.eventId);

	return {
		id: booking.id,
		eventId: booking.eventId,
		quantity: booking.quantity,
		status: booking.status,
		bookedBy: booking.bookedBy,
		delegatorName: booking.delegatorName ?? undefined,
		agentName: booking.agentName ?? undefined,
		createdAt: booking.createdAt,
		event: event ?? undefined,
		errorMessage: booking.errorMessage ?? undefined,
	};
}

export const bookingsRouter = new Hono()
	.post("/", zValidator("json", createBookingRequestSchema), async (c) => {
		const { eventId, quantity } = c.req.valid("json");

		const event = getEventById(eventId);
		if (!event) {
			return c.json({ error: "Event not found" }, 404);
		}

		if (event.availableTickets < quantity) {
			return c.json({ error: "Insufficient tickets available" }, 400);
		}

		const auth = getAuthenticatedUserIfPresent(c);
		if (auth) {
			const { session, user } = auth;
			if (!user.identityVerified || !user.givenName || !user.familyName) {
				return c.json(
					{ error: "Identity verification is required for direct bookings" },
					403,
				);
			}

			const booking = createBooking({
				id: crypto.randomUUID(),
				eventId,
				quantity,
				userId: session.userId,
				bookedBy: "user",
				status: "confirmed",
				delegatorName: `${user.givenName} ${user.familyName}`,
			});

			return c.json({
				id: booking.id,
				eventId: booking.eventId,
				quantity: booking.quantity,
				status: booking.status,
				bookedBy: booking.bookedBy,
				delegatorName: booking.delegatorName ?? undefined,
				agentName: booking.agentName ?? undefined,
			});
		}

		const authResult = await createDelegationAuthorizationRequest();
		const statusToken = crypto.randomUUID();

		const booking = createBooking({
			id: crypto.randomUUID(),
			eventId,
			quantity,
			bookedBy: "agent",
			status: "pending_verification",
			agentName: undefined,
			authorizationId: authResult.authorizationId,
			statusToken,
		});

		startAuthorizationMonitor({
			type: "booking_verification",
			authorizationId: authResult.authorizationId,
			bookingId: booking.id,
		});

		return c.json({
			id: booking.id,
			eventId: booking.eventId,
			quantity: booking.quantity,
			status: booking.status,
			bookedBy: booking.bookedBy,
			authorizeUrl: authResult.authorizeUrl,
			statusToken,
		});
	})
	.get("/", (c) => {
		const auth = requireAuthenticatedUser(c);
		if (!auth.ok) {
			return auth.response;
		}

		const bookings = getBookingsByUserId(auth.user.id)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
			.map((booking) => serializeBooking(booking));

		return c.json(bookings);
	})
	.get("/:id", (c) => {
		const auth = requireAuthenticatedUser(c);
		if (!auth.ok) {
			return auth.response;
		}

		const id = c.req.param("id");
		const booking = getBookingById(id);

		if (!booking) {
			return c.json({ error: "Booking not found" }, 404);
		}

		if (booking.userId !== auth.user.id) {
			return c.json({ error: "Booking not found" }, 404);
		}

		return c.json(serializeBooking(booking));
	})
	.get("/:id/inspection", async (c) => {
		const auth = requireAuthenticatedUser(c);
		if (!auth.ok) {
			return auth.response;
		}

		const id = c.req.param("id");
		const booking = getBookingById(id);

		if (!booking || booking.userId !== auth.user.id) {
			return c.json({ error: "Booking not found" }, 404);
		}

		if (booking.bookedBy !== "agent" || !booking.authorizationId) {
			return c.json(
				{ error: "Inspection is only available for agent bookings" },
				400,
			);
		}

		try {
			const inspection = await getAuthorizationInspectionDetails(
				booking.authorizationId,
			);

			return c.json(
				bookingInspectionResponseSchema.parse({
					id: booking.id,
					authorizationId: booking.authorizationId,
					policyResults: inspection.policyResults,
					credentials: inspection.credentials,
				}),
			);
		} catch (error) {
			console.error("[Bookings] Failed to inspect authorization:", error);
			return c.json({ error: "Failed to load booking inspection" }, 502);
		}
	})
	.get("/status/:token", (c) => {
		const token = c.req.param("token");
		const booking = getBookingByStatusToken(token);

		if (!booking) {
			return c.json({ error: "Booking not found" }, 404);
		}

		return c.json(serializeBooking(booking));
	});
