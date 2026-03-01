import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { apiClient } from "@/lib/api-client";
import "./index.css";

const queryClient = new QueryClient();

const restoreGithubPagesPath = (basepath: string) => {
	const params = new URLSearchParams(window.location.search);
	const ghPath = params.get("__gh_path");

	if (!ghPath) {
		return;
	}

	const ghSearch = params.get("__gh_search");
	const ghHash = params.get("__gh_hash");
	const restoredPath = decodeURIComponent(ghPath);
	const normalizedPath = restoredPath.startsWith("/")
		? restoredPath
		: `/${restoredPath}`;
	const restoredSearch = ghSearch ? decodeURIComponent(ghSearch) : "";
	const restoredHash = ghHash ? decodeURIComponent(ghHash) : "";

	window.history.replaceState(
		null,
		"",
		`${basepath}${normalizedPath}${restoredSearch}${restoredHash}`,
	);
};

restoreGithubPagesPath("/bank");

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
	basepath: "/bank",
	routeTree,
	context: {
		apiClient,
	},
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error(
		"Root element not found. Check if it's in your index.html or if the id is correct.",
	);
}

// Render the app
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
					<Toaster />
				</QueryClientProvider>
			</ThemeProvider>
		</StrictMode>,
	);
}
