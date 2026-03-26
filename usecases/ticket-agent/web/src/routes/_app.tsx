import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
	return (
		<div className="min-h-screen flex flex-col bg-background">
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}
