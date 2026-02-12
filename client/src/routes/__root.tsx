import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createContext, useContext, useState } from "react";
import { Header } from "@/components/layout/header";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

// Progress context for journey tracking
type JourneyStep = "intro" | "authenticate" | "action" | "finish" | null;

export const ProgressContext = createContext<{
	currentStep: JourneyStep;
	setCurrentStep: (step: JourneyStep) => void;
} | null>(null);

export const useProgress = () => {
	const context = useContext(ProgressContext);
	if (!context)
		throw new Error("useProgress must be used within ProgressContext");
	return context;
};

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	const [currentStep, setCurrentStep] = useState<JourneyStep>("intro");

	return (
		<ProgressContext.Provider value={{ currentStep, setCurrentStep }}>
			<div className="min-h-screen flex flex-col bg-background">
				<Header />
				<ProgressIndicator />
				<main className="flex-1">
					<Outlet />
				</main>
			</div>
			<TanStackRouterDevtools />
		</ProgressContext.Provider>
	);
}
