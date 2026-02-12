import { useLocation } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { getJourneyStep, type JourneyStep } from "@/lib/route-config";
import { cn } from "@/lib/utils";

const steps: { id: JourneyStep; label: string; shortLabel: string }[] = [
	{ id: "intro", label: "Start", shortLabel: "Start" },
	{ id: "authenticate", label: "Authenticated", shortLabel: "Auth" },
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

	// Always render, but show all steps as inactive if no journey step
	const currentStepIndex =
		currentStep !== null ? getStepIndex(currentStep) : -1;

	return (
		<div className="w-full bg-background/80 backdrop-blur-sm border-t border-border/40">
			<div className="max-w-3xl mx-auto px-4 py-2">
				<nav aria-label="Progress">
					<ol className="flex items-center justify-between">
						{steps.map((step, index) => {
							const stepIndex = getStepIndex(step.id);
							const isCompleted = stepIndex < currentStepIndex;
							const isCurrent = step.id === currentStep;
							const isUpcoming =
								stepIndex > currentStepIndex || currentStep === null;

							return (
								<li key={step.id} className="flex items-center">
									{/* Step indicator */}
									<div className="flex flex-col items-center gap-1">
										<div
											className={cn(
												"w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
												isCompleted && "bg-primary/70 text-primary-foreground",
												isCurrent &&
													"bg-primary/80 text-primary-foreground ring-1 ring-primary/50 ring-offset-1",
												isUpcoming &&
													"bg-muted/50 text-muted-foreground/60 border border-muted-foreground/20",
											)}
										>
											{isCompleted ? (
												<Check className="w-3 h-3" />
											) : (
												<span>{index + 1}</span>
											)}
										</div>
										{/* Label - full on sm+, abbreviated on mobile */}
										<span
											className={cn(
												"text-[10px] font-medium",
												isCurrent && "text-primary/80",
												isCompleted && "text-primary/70",
												isUpcoming && "text-muted-foreground/60",
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
												"flex-1 h-[1px] mx-2 sm:mx-4",
												stepIndex < currentStepIndex
													? "bg-primary/60"
													: "bg-muted-foreground/20",
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
