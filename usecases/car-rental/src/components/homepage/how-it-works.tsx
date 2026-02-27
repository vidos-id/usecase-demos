import { Key, Search, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Step {
	number: number;
	icon: React.ReactNode;
	title: string;
	description: string;
}

const steps: Step[] = [
	{
		number: 1,
		icon: <Search className="size-5" />,
		title: "Search & Select",
		description:
			"Browse our curated fleet, filter by category, dates, and location. Choose the car that fits your journey.",
	},
	{
		number: 2,
		icon: <Shield className="size-5" />,
		title: "Verify Identity",
		description:
			"Present your digital ID and driving licence from your EU Digital Identity Wallet. Secure, instant, and privacy-first.",
	},
	{
		number: 3,
		icon: <Key className="size-5" />,
		title: "Pick Up & Drive",
		description:
			"Receive your locker PIN by message. No queues, no paperwork — just grab your keys and go.",
	},
];

function StepCard({ step, index }: { step: Step; index: number }) {
	const delayClass = [`delay-1`, `delay-2`, `delay-3`][index] ?? "";
	const isLast = index === steps.length - 1;

	return (
		<div className="relative flex flex-1 flex-col items-center text-center">
			{/* Connector line (desktop) */}
			{!isLast && (
				<div
					className="pointer-events-none absolute left-[calc(50%+3rem)] top-8 hidden h-px flex-1 lg:block"
					style={{
						width: "calc(100% - 6rem)",
						background:
							"linear-gradient(90deg, var(--border) 0%, transparent 100%)",
					}}
				/>
			)}

			{/* Step number + icon */}
			<div
				className={cn(
					"animate-scale-in relative mb-5 flex size-16 items-center justify-center rounded-2xl shadow-sm",
					delayClass,
				)}
				style={{ background: "var(--primary)" }}
			>
				<div style={{ color: "oklch(0.99 0 0)" }}>{step.icon}</div>
				{/* Number badge */}
				<div
					className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-xs font-bold"
					style={{
						background: "var(--amber)",
						color: "var(--amber-foreground)",
					}}
				>
					{step.number}
				</div>
			</div>

			{/* Content */}
			<div className={cn("animate-slide-up", delayClass)}>
				<h3 className="font-heading mb-2 text-lg font-bold">{step.title}</h3>
				<p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
					{step.description}
				</p>
			</div>
		</div>
	);
}

export function HowItWorks() {
	return (
		<section
			className="border-y border-border/50 py-20"
			style={{ background: "var(--surface)" }}
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6">
				{/* Header */}
				<div className="mb-14 text-center">
					<Badge
						variant="secondary"
						className="mb-3 font-mono text-xs uppercase tracking-wider"
					>
						Process
					</Badge>
					<h2 className="font-heading mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
						How It Works
					</h2>
					<p className="mx-auto max-w-md text-muted-foreground">
						From search to steering wheel in three effortless steps.
					</p>
				</div>

				{/* Steps */}
				<div className="flex flex-col gap-12 lg:flex-row lg:gap-0 lg:items-start">
					{steps.map((step, index) => (
						<StepCard key={step.number} step={step} index={index} />
					))}
				</div>
			</div>
		</section>
	);
}
