import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { type Session, sessions as sessionsTable } from "../db/schema";

export type { Session };

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

const mapRowToSession = (row: typeof sessionsTable.$inferSelect): Session => {
	return {
		id: row.id,
		userId: row.userId,
		mode: row.mode as Session["mode"],
		createdAt: new Date(row.createdAt),
		expiresAt: new Date(row.expiresAt),
	};
};

export const createSession = (
	data: Omit<Session, "id" | "createdAt" | "expiresAt">,
	ttlMs: number = DEFAULT_TTL_MS,
): Session => {
	const now = new Date();
	const session: Session = {
		...data,
		id: randomUUID(),
		createdAt: now,
		expiresAt: new Date(now.getTime() + ttlMs),
	};

	db.insert(sessionsTable)
		.values({
			id: session.id,
			userId: session.userId,
			mode: session.mode,
			createdAt: session.createdAt.toISOString(),
			expiresAt: session.expiresAt.toISOString(),
		})
		.run();
	return session;
};

export const getSessionById = (id: string): Session | undefined => {
	const row = db
		.select()
		.from(sessionsTable)
		.where(eq(sessionsTable.id, id))
		.get();
	if (!row) {
		return undefined;
	}
	const session = mapRowToSession(row);
	if (new Date() > session.expiresAt) {
		return undefined;
	}
	return session;
};

export const getSessionsByUserId = (userId: string): Session[] => {
	const now = new Date();
	const rows = db
		.select()
		.from(sessionsTable)
		.where(eq(sessionsTable.userId, userId))
		.all();
	return rows
		.map(mapRowToSession)
		.filter((session) => now <= session.expiresAt);
};

export const deleteSession = (id: string): boolean => {
	const row = db
		.select({ id: sessionsTable.id })
		.from(sessionsTable)
		.where(eq(sessionsTable.id, id))
		.get();
	if (!row) {
		return false;
	}
	db.delete(sessionsTable).where(eq(sessionsTable.id, id)).run();
	return true;
};

export const clearAllSessions = (): void => {
	db.delete(sessionsTable).run();
};
