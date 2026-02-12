import { useLocation } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { getJourneyStep, type JourneyStep } from "@/lib/route-config";
import { cn } from "@/lib/utils";

const steps: { id: JourneyStep; label: string; shortLabel: string }[] = [
	{ id: "intro", label: "Start", shortLabel: "Start" },
	{ id: "authenticate", label: "Authenticate", shortLabel: "Auth" },
	{ id: "action", label: "Action", shortLabel: "Act" },
	{ id: "finish", label: "Complete", shortLabel: "Done" },
];

// Order of steps for comparison
const stepOrder: JourneyStep[] = ["intro", "authenticate", "action", "finish"];

function getStepIndex(step: JourneyStep): number {
	return stepOrder.indexOf(step);
}

export function ProgressIndicator() {
	const location = useLocation();
	const currentStep = getJourneyStep(location.pathname);

	// Don't render if step is null (dashboard, profile, etc.)
	if (currentStep === null) {
		return null;
	}

	const currentStepIndex = getStepIndex(currentStep);

	return (
		<div className="w-full bg-muted/50 border-b">
			<div className="max-w-3xl mx-auto px-4 py-3">
				<nav aria-label="Progress">
					<ol className="flex items-center justify-between">
						{steps.map((step, index) => {
							const stepIndex = getStepIndex(step.id);
							const isCompleted = stepIndex < currentStepIndex;
							const isCurrent = step.id === currentStep;
							const isUpcoming = stepIndex > currentStepIndex;

							return (
								<li key={step.id} className="flex items-center">
									{/* Step indicator */}
									<div className="flex flex-col items-center gap-1">
										<div
											className={cn(
												"w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
												isCompleted && "bg-primary text-primary-foreground",
												isCurrent &&
													"bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
												isUpcoming &&
													"bg-muted text-muted-foreground border border-muted-foreground/30",
											)}
										>
											{isCompleted ? (
												<Check className="w-4 h-4" />
											) : (
												<span>{index + 1}</span>
											)}
										</div>
										{/* Label - full on sm+, abbreviated on mobile */}
										<span
											className={cn(
												"text-xs font-medium",
												isCurrent && "text-primary",
												isCompleted && "text-primary",
												isUpcoming && "text-muted-foreground",
											)}
										>
											<span className="hidden sm:inline">{step.label}</span>
											<span className="sm:hidden">{step.shortLabel}</span>
										</span>
									</div>

									{/* Connector line (except after last step) */}
									{index < steps.length - 1 && (
										<div
											className={cn(
												"flex-1 h-0.5 mx-2 sm:mx-4",
												stepIndex < currentStepIndex
													? "bg-primary"
													: "bg-muted-foreground/30",
											)}
										/>
									)}
								</li>
							);
						})}
					</ol>
				</nav>
			</div>
		</div>
	);
}
