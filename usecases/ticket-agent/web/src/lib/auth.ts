import { createSessionStore } from "vidos-web/session-store";

export const {
	checkSession,
	clearSession,
	getSessionId,
	setSessionId,
	subscribeSession,
	useIsAuthenticated,
	useSessionId,
} = createSessionStore();
