import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createBookingRequestSchema } from "ticket-agent-shared/api/bookings";
import { getEventById } from "ticket-agent-shared/lib/events";
import { startAuthorizationMonitor } from "../services/authorization-monitor";
import { createDelegationAuthorizationRequest } from "../services/vidos";
import { createBooking, getBookingById } from "../stores/bookings";
import { getActiveDelegationSessionByUserId } from "../stores/delegation-sessions";
import { getSessionById } from "../stores/sessions";
import { getUserById } from "../stores/users";

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

		const sessionId = c.req.header("Authorization")?.replace("Bearer ", "");
		if (sessionId) {
			const session = getSessionById(sessionId);
			if (session) {
				const user = getUserById(session.userId);
				if (user?.identityVerified && user.givenName && user.familyName) {
					const booking = createBooking({
						id: crypto.randomUUID(),
						eventId,
						quantity,
						userId: session.userId,
						status: "confirmed",
						delegatorName: `${user.givenName} ${user.familyName}`,
					});

					return c.json({
						id: booking.id,
						eventId: booking.eventId,
						quantity: booking.quantity,
						status: booking.status,
						delegatorName: booking.delegatorName ?? undefined,
					});
				}
			}
		}

		const authResult = await createDelegationAuthorizationRequest();

		let delegationSessionId: string | undefined;
		if (sessionId) {
			const session = getSessionById(sessionId);
			if (session) {
				const delegationSession = getActiveDelegationSessionByUserId(
					session.userId,
				);
				delegationSessionId = delegationSession?.id;
			}
		}

		const booking = createBooking({
			id: crypto.randomUUID(),
			eventId,
			quantity,
			status: "pending_verification",
			authorizationId: authResult.authorizationId,
		});

		startAuthorizationMonitor({
			type: "booking_verification",
			authorizationId: authResult.authorizationId,
			bookingId: booking.id,
			delegationSessionId,
		});

		return c.json({
			id: booking.id,
			eventId: booking.eventId,
			quantity: booking.quantity,
			status: booking.status,
			authorizeUrl: authResult.authorizeUrl,
		});
	})
	.get("/:id", (c) => {
		const id = c.req.param("id");
		const booking = getBookingById(id);

		if (!booking) {
			return c.json({ error: "Booking not found" }, 404);
		}

		const event = getEventById(booking.eventId);

		return c.json({
			id: booking.id,
			eventId: booking.eventId,
			quantity: booking.quantity,
			status: booking.status,
			delegatorName: booking.delegatorName ?? undefined,
			createdAt: booking.createdAt,
			event: event ?? undefined,
			errorMessage: booking.errorMessage ?? undefined,
		});
	});
