import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { Client } from "server/client";

export interface RouterContext {
	apiClient: Client;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<>
			<Outlet />
			<TanStackRouterDevtools />
		</>
	);
}
