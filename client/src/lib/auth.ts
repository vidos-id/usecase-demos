// Placeholder session check - returns false for now
// Will be replaced with actual session check in auth-flows change
export async function checkSession(): Promise<boolean> {
	// Check sessionStorage for session ID
	const sessionId = sessionStorage.getItem("sessionId");
	return !!sessionId;
}

// Get stored session ID
export function getSessionId(): string | null {
	return sessionStorage.getItem("sessionId");
}

// Store session ID
export function setSessionId(sessionId: string): void {
	sessionStorage.setItem("sessionId", sessionId);
}

// Clear session
export function clearSession(): void {
	sessionStorage.removeItem("sessionId");
	sessionStorage.removeItem("authMode");
}
