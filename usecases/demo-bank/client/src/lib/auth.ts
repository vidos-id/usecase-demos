import { useSyncExternalStore } from "react";

type SessionListener = () => void;

const sessionListeners = new Set<SessionListener>();

function notifySessionChange() {
	for (const listener of sessionListeners) {
		listener();
	}
}

export function subscribeSession(listener: SessionListener): () => void {
	sessionListeners.add(listener);
	return () => {
		sessionListeners.delete(listener);
	};
}

export async function checkSession(): Promise<boolean> {
	return !!getSessionId();
}

// Get stored session ID
export function getSessionId(): string | null {
	if (typeof window === "undefined") {
		return null;
	}

	return localStorage.getItem("sessionId");
}

export function useSessionId(): string | null {
	return useSyncExternalStore(subscribeSession, getSessionId, () => null);
}

export function useIsAuthenticated(): boolean {
	return useSessionId() !== null;
}

// Store session ID
export function setSessionId(sessionId: string): void {
	localStorage.setItem("sessionId", sessionId);
	notifySessionChange();
}

// Clear session
export function clearSession(): void {
	localStorage.removeItem("sessionId");
	localStorage.removeItem("authMode");
	notifySessionChange();
}
