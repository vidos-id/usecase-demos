import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions } from "../db/schema";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createSession(userId: string): {
	id: string;
	userId: string;
	expiresAt: string;
} {
	const id = crypto.randomUUID();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

	return db
		.insert(sessions)
		.values({
			id,
			userId,
			createdAt: now.toISOString(),
			expiresAt: expiresAt.toISOString(),
		})
		.returning()
		.get();
}

export function getSessionById(id: string) {
	const session = db.select().from(sessions).where(eq(sessions.id, id)).get();
	if (!session) return undefined;
	if (new Date(session.expiresAt) < new Date()) return undefined;
	return session;
}

export function deleteSession(id: string) {
	return db.delete(sessions).where(eq(sessions.id, id)).run();
}
