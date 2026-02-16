// Placeholder session check - returns false for now
// Will be replaced with actual session check in auth-flows change
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
	// Check localStorage for session ID
	const sessionId = localStorage.getItem("sessionId");
	return !!sessionId;
}

// Get stored session ID
export function getSessionId(): string | null {
	return localStorage.getItem("sessionId");
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
