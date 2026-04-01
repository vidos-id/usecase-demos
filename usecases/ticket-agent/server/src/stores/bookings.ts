import { eq } from "drizzle-orm";
import { db } from "../db";
import { bookings } from "../db/schema";

export function createBooking(data: {
	id: string;
	eventId: string;
	quantity: number;
	userId?: string;
	bookedBy?: "user" | "agent";
	status?: string;
	delegatorName?: string;
	agentName?: string;
	authorizationId?: string;
	statusToken?: string;
	delegationSessionId?: string;
}) {
	const now = new Date().toISOString();
	return db
		.insert(bookings)
		.values({
			id: data.id,
			eventId: data.eventId,
			quantity: data.quantity,
			userId: data.userId ?? null,
			bookedBy: data.bookedBy ?? "user",
			status: data.status ?? "pending_verification",
			delegatorName: data.delegatorName ?? null,
			agentName: data.agentName ?? null,
			authorizationId: data.authorizationId ?? null,
			statusToken: data.statusToken ?? null,
			delegationSessionId: data.delegationSessionId ?? null,
			createdAt: now,
		})
		.returning()
		.get();
}

export function getBookingById(id: string) {
	return db.select().from(bookings).where(eq(bookings.id, id)).get();
}

export function getBookingByAuthorizationId(authorizationId: string) {
	return db
		.select()
		.from(bookings)
		.where(eq(bookings.authorizationId, authorizationId))
		.get();
}

export function getBookingByStatusToken(statusToken: string) {
	return db
		.select()
		.from(bookings)
		.where(eq(bookings.statusToken, statusToken))
		.get();
}

export function assignBookingUser(id: string, userId: string) {
	return db
		.update(bookings)
		.set({ userId })
		.where(eq(bookings.id, id))
		.returning()
		.get();
}

export function updateBookingStatus(
	id: string,
	update: {
		status: string;
		delegatorName?: string;
		agentName?: string;
		delegationSessionId?: string;
		errorMessage?: string;
	},
) {
	return db
		.update(bookings)
		.set({
			status: update.status,
			delegatorName: update.delegatorName,
			agentName: update.agentName,
			delegationSessionId: update.delegationSessionId,
			errorMessage: update.errorMessage,
		})
		.where(eq(bookings.id, id))
		.returning()
		.get();
}

export function getBookingsByUserId(userId: string) {
	return db.select().from(bookings).where(eq(bookings.userId, userId)).all();
}
