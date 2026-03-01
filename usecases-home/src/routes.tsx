import {
	createBrowserHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { App } from "./app";
import { CredentialPrepPage } from "./pages/credential-prep";
import { HowDemosWorkPage } from "./pages/how-demos-work";
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

const routeTree = rootRoute.addChildren([
	homeRoute,
	walletSetupRoute,
	credentialPrepRoute,
	howDemosWorkRoute,
]);

export const router = createRouter({
	routeTree,
	history: createBrowserHistory(),
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
