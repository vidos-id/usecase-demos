import { randomUUID } from "crypto";
import type { Session } from "../types/session";

const sessions = new Map<string, Session>();

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

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
	sessions.set(session.id, session);
	return session;
};

export const getSessionById = (id: string): Session | undefined => {
	const session = sessions.get(id);
	if (!session) {
		return undefined;
	}
	// Check if expired
	if (new Date() > session.expiresAt) {
		return undefined;
	}
	return session;
};

export const getSessionsByUserId = (userId: string): Session[] => {
	const now = new Date();
	const result: Session[] = [];
	for (const session of sessions.values()) {
		if (session.userId === userId && now <= session.expiresAt) {
			result.push(session);
		}
	}
	return result;
};

export const deleteSession = (id: string): boolean => {
	return sessions.delete(id);
};

export const clearAllSessions = (): void => {
	sessions.clear();
};
