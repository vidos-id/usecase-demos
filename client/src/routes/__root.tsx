import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { Client } from "server/client";
import { PersistentDebugConsole } from "@/components/auth/persistent-debug-console";
import {
	DebugConsoleProvider,
	useDebugConsole,
} from "@/lib/debug-console-context";

export interface RouterContext {
	apiClient: Client;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<DebugConsoleProvider>
			<Outlet />
			<TanStackRouterDevtools />
			<DebugConsoleManager />
		</DebugConsoleProvider>
	);
}

function DebugConsoleManager() {
	const { requestId, debugSessionId } = useDebugConsole();
	return (
		<PersistentDebugConsole
			requestId={requestId}
			debugSessionId={debugSessionId}
		/>
	);
}
