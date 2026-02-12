import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard")({
	component: () => <div>Page: /dashboard - Coming Soon</div>,
});
