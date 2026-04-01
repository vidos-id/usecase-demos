import { useSyncExternalStore } from "react";

type SessionListener = () => void;

type CreateSessionStoreOptions = {
	key?: string;
	onClear?: () => void;
};

export function createSessionStore(options: CreateSessionStoreOptions = {}) {
	const { key = "sessionId", onClear } = options;
	const sessionListeners = new Set<SessionListener>();

	function notifySessionChange() {
		for (const listener of sessionListeners) {
			listener();
		}
	}

	function subscribeSession(listener: SessionListener): () => void {
		sessionListeners.add(listener);
		return () => {
			sessionListeners.delete(listener);
		};
	}

	function getSessionId(): string | null {
		if (typeof window === "undefined") {
			return null;
		}

		return localStorage.getItem(key);
	}

	function useSessionId(): string | null {
		return useSyncExternalStore(subscribeSession, getSessionId, () => null);
	}

	function useIsAuthenticated(): boolean {
		return useSessionId() !== null;
	}

	function setSessionId(sessionId: string): void {
		localStorage.setItem(key, sessionId);
		notifySessionChange();
	}

	function clearSession(): void {
		localStorage.removeItem(key);
		onClear?.();
		notifySessionChange();
	}

	async function checkSession(): Promise<boolean> {
		return !!getSessionId();
	}

	return {
		checkSession,
		clearSession,
		getSessionId,
		setSessionId,
		subscribeSession,
		useIsAuthenticated,
		useSessionId,
	};
}
