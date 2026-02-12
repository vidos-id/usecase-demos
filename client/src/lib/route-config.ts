export type JourneyStep = "intro" | "authenticate" | "action" | "finish" | null;

// Maps route paths to journey steps
export const routeStepMap: Record<string, JourneyStep> = {
	"/": "intro",
	"/signup": "authenticate",
	"/signin": "authenticate",
	"/send": "action",
	"/send/confirm": "action",
	"/send/success": "finish",
	"/loan": "action",
	"/loan/success": "finish",
	"/dashboard": null, // No progress on dashboard
	"/profile": null, // No progress on profile
};

// Get journey step from current path
export function getJourneyStep(pathname: string): JourneyStep {
	return routeStepMap[pathname] ?? null;
}
