import { useLocation } from "@tanstack/react-router";
import { Check, CircleDot } from "lucide-react";
import { useIsAuthenticated } from "@/lib/auth";
import { getJourneyStep, type JourneyStep } from "@/lib/route-config";
import { cn } from "@/lib/utils";

const stepOrder: JourneyStep[] = ["intro", "authenticate", "action", "finish"];

function getStepIndex(step: JourneyStep): number {
	return stepOrder.indexOf(step);
}

function getSteps(isAuthenticated: boolean) {
	return [
		{
			id: "intro" as JourneyStep,
			label: "Welcome",
			description: "Discover DemoBank",
		},
		{
			id: "authenticate" as JourneyStep,
			label: isAuthenticated ? "Authorized" : "Authorize",
			description: isAuthenticated
				? "Identity verified"
				: "Prove your identity",
		},
		{
			id: "action" as JourneyStep,
			label: "Transact",
			description: "Complete your action",
		},
		{
			id: "finish" as JourneyStep,
			label: "Done",
			description: "Transaction complete",
		},
	];
}

export function ProgressIndicator() {
	const location = useLocation();
	const currentStep = getJourneyStep(location.pathname);
	const currentStepIndex =
		currentStep !== null ? getStepIndex(currentStep) : -1;
	const isAuthenticated = useIsAuthenticated();

	const steps = getSteps(isAuthenticated);

	return (
		<>
			{/* Desktop: Vertical rail on left */}
			<div className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 z-40 pl-6">
				<nav aria-label="Progress" className="relative">
					{/* Vertical connecting line */}
					<div className="absolute left-[11px] top-4 bottom-4 w-px bg-border/60" />
					{/* Progress fill */}
					<div
						className="absolute left-[11px] top-4 w-px bg-primary/70 transition-all duration-500 ease-out"
						style={{
							height:
								currentStepIndex >= 0
									? `${(currentStepIndex / (steps.length - 1)) * 100}%`
									: "0%",
						}}
					/>

					<ol className="relative flex flex-col gap-8">
						{steps.map((step) => {
							const stepIndex = getStepIndex(step.id);
							// Auth step shows as completed when authenticated
							const isAuthStepCompleted =
								step.id === "authenticate" && isAuthenticated;
							const isCompleted =
								stepIndex < currentStepIndex || isAuthStepCompleted;
							const isCurrent = step.id === currentStep && !isAuthStepCompleted;
							const isUpcoming =
								(stepIndex > currentStepIndex || currentStep === null) &&
								!isAuthStepCompleted;

							return (
								<li key={step.id} className="flex items-center gap-3">
									{/* Step dot */}
									<div
										className={cn(
											"relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300",
											isCompleted &&
												"border-primary bg-primary text-primary-foreground",
											isCurrent &&
												"border-primary bg-background ring-4 ring-primary/20",
											isUpcoming && "border-muted-foreground/30 bg-background",
										)}
									>
										{isCompleted ? (
											<Check className="h-3 w-3" strokeWidth={3} />
										) : isCurrent ? (
											<CircleDot className="h-3.5 w-3.5 text-primary" />
										) : (
											<span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
										)}
									</div>

									{/* Label group */}
									<div
										className={cn(
											"flex flex-col transition-opacity duration-300",
											isUpcoming && "opacity-50",
										)}
									>
										<span
											className={cn(
												"text-xs font-semibold tracking-wide uppercase",
												isCurrent && "text-primary",
												isCompleted && "text-primary",
												isUpcoming && "text-muted-foreground",
											)}
										>
											{step.label}
										</span>
										<span
											className={cn(
												"text-[10px] text-muted-foreground/70 max-w-[100px] leading-tight",
												isCurrent && "text-muted-foreground",
											)}
										>
											{step.description}
										</span>
									</div>
								</li>
							);
						})}
					</ol>
				</nav>
			</div>

			{/* Mobile/Tablet: Horizontal compact bar */}
			<div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40">
				<div className="max-w-3xl mx-auto px-4 py-2">
					<nav aria-label="Progress">
						<ol className="flex items-center justify-between">
							{steps.map((step, index) => {
								const stepIndex = getStepIndex(step.id);
								// Auth step shows as completed when authenticated
								const isAuthStepCompleted =
									step.id === "authenticate" && isAuthenticated;
								const isCompleted =
									stepIndex < currentStepIndex || isAuthStepCompleted;
								const isCurrent =
									step.id === currentStep && !isAuthStepCompleted;
								const isUpcoming =
									(stepIndex > currentStepIndex || currentStep === null) &&
									!isAuthStepCompleted;

								return (
									<li key={step.id} className="flex items-center flex-1">
										<div className="flex flex-col items-center gap-1">
											{/* Step indicator */}
											<div
												className={cn(
													"h-2 w-2 rounded-full transition-all duration-300",
													isCompleted && "bg-primary",
													isCurrent && "bg-primary ring-2 ring-primary/30",
													isUpcoming && "bg-muted-foreground/30",
												)}
											/>
											{/* Label */}
											<span
												className={cn(
													"text-[9px] font-medium uppercase tracking-wider",
													isCurrent && "text-primary",
													isCompleted && "text-primary",
													isUpcoming && "text-muted-foreground/50",
												)}
											>
												{step.label}
											</span>
										</div>

										{/* Connector */}
										{index < steps.length - 1 && (
											<div
												className={cn(
													"flex-1 h-px mx-2",
													stepIndex < currentStepIndex
														? "bg-primary/50"
														: "bg-border/40",
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
		</>
	);
}
