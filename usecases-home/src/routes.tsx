import {
	createBrowserHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { App } from "./app";
import { CredentialPrepPage } from "./pages/credential-prep";
import { HowDemosWorkPage } from "./pages/how-demos-work";
import { McpCarRentalAgentPage } from "./pages/mcp-car-rental-agent";
import { McpWineAgentPage } from "./pages/mcp-wine-agent";
import { WalletSetupPage } from "./pages/wallet-setup";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: App,
});

const walletSetupRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/wallet-setup",
	component: WalletSetupPage,
});

const credentialPrepRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/credential-prep",
	component: CredentialPrepPage,
});

const howDemosWorkRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/how-demos-work",
	component: HowDemosWorkPage,
});

const mcpWineAgentRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/mcp-wine-agent",
	component: McpWineAgentPage,
});

const mcpCarRentalAgentRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/mcp-car-rental-agent",
	component: McpCarRentalAgentPage,
});

const routeTree = rootRoute.addChildren([
	homeRoute,
	walletSetupRoute,
	credentialPrepRoute,
	howDemosWorkRoute,
	mcpCarRentalAgentRoute,
	mcpWineAgentRoute,
]);

export const router = createRouter({
	routeTree,
	history: createBrowserHistory(),
	scrollRestoration: true,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
