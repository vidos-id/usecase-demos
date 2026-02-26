import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
	return (
		<div className="min-h-screen flex flex-col bg-background">
			<Header />
			{/* Progress rail - always visible */}
			<ProgressIndicator />
			{/* Main content - offset for mobile progress bar, left margin for desktop rail */}
			<main className="flex-1 pt-12 lg:pt-0 lg:pl-44">
				<Outlet />
			</main>
		</div>
	);
}
