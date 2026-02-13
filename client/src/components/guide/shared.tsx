import { ArrowRight, CheckCircle2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// Section Components
// ============================================================================

export function SectionHeader({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex items-start gap-4">
			<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
				{icon}
			</div>
			<div>
				<h2 className="text-xl font-bold tracking-tight">{title}</h2>
				<p className="text-sm text-muted-foreground mt-1">{description}</p>
			</div>
		</div>
	);
}

// ============================================================================
// Wallet Guide Section
// ============================================================================

export function WalletGuideSection({
	icon,
	name,
	tagline,
	compatibility,
	downloadUrl,
	downloadLabel,
	steps,
}: {
	icon: React.ReactNode;
	name: string;
	tagline: string;
	compatibility: string;
	downloadUrl: string;
	downloadLabel: string;
	steps: Array<{
		title: string;
		content: React.ReactNode;
	}>;
}) {
	return (
		<div className="space-y-6">
			{/* Header Card */}
			<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/60 p-6">
				<div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

				<div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
							{icon}
						</div>
						<div>
							<h2 className="text-2xl font-bold tracking-tight">{name}</h2>
							<p className="text-sm text-muted-foreground">{tagline}</p>
						</div>
					</div>

					<div className="flex flex-col sm:items-end gap-2">
						<span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
							<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
							{compatibility}
						</span>
						<Button asChild variant="outline" size="sm" className="w-fit">
							<a href={downloadUrl} target="_blank" rel="noopener noreferrer">
								<Download className="h-4 w-4 mr-2" />
								{downloadLabel}
							</a>
						</Button>
					</div>
				</div>
			</div>

			{/* Steps */}
			<div className="space-y-3">
				{steps.map((step, index) => (
					<div
						key={step.title}
						className="rounded-xl border border-border/60 bg-background overflow-hidden"
					>
						<div className="w-full flex items-center gap-4 p-4 text-left">
							<div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-mono text-sm font-bold shrink-0">
								{index + 1}
							</div>
							<span className="font-semibold flex-1">{step.title}</span>
						</div>
						<div className="px-4 pb-4 pl-16 text-sm text-muted-foreground space-y-4">
							{step.content}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// ============================================================================
// Step & Content Components
// ============================================================================

export function StepItem({
	number,
	children,
}: {
	number: number;
	children: React.ReactNode;
}) {
	return (
		<li className="flex gap-3">
			<span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-mono font-bold text-muted-foreground shrink-0">
				{number}
			</span>
			<span className="text-foreground/80">{children}</span>
		</li>
	);
}

export function LinkButton({
	href,
	icon,
	children,
}: {
	href: string;
	icon: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
		>
			{icon}
			{children}
		</a>
	);
}

export function Callout({
	children,
	variant = "info",
}: {
	children: React.ReactNode;
	variant?: "info" | "warning" | "tip";
}) {
	const variants = {
		info: "bg-primary/5 border-primary/20 text-foreground/80",
		warning:
			"bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200",
		tip: "bg-green-500/10 border-green-500/20 text-green-900 dark:text-green-200",
	};

	return (
		<div
			className={cn(
				"mt-3 p-3 rounded-lg border text-sm leading-relaxed",
				variants[variant],
			)}
		>
			{children}
		</div>
	);
}

export function MethodCard({
	icon,
	title,
	description,
	note,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	note: string;
}) {
	return (
		<div className="p-4 rounded-xl bg-muted/30 border border-border/40">
			<div className="flex items-start gap-3">
				<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
					{icon}
				</div>
				<div>
					<h4 className="font-semibold text-foreground">{title}</h4>
					<p className="text-sm text-muted-foreground mt-1">{description}</p>
					<p className="text-xs text-muted-foreground/70 mt-2 italic">{note}</p>
				</div>
			</div>
		</div>
	);
}

export function ProtocolCard({
	title,
	description,
	href,
}: {
	title: string;
	description: string;
	href: string;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="group p-5 rounded-xl border border-border/60 bg-background hover:border-primary/40 transition-colors"
		>
			<div className="flex items-start justify-between">
				<div>
					<h3 className="font-semibold font-mono text-primary">{title}</h3>
					<p className="text-sm text-muted-foreground mt-1">{description}</p>
				</div>
				<ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
			</div>
		</a>
	);
}

// ============================================================================
// Quick Start Card
// ============================================================================

export function QuickStartCard({
	href,
	title,
	description,
	primary = false,
}: {
	href: string;
	title: string;
	description: string;
	primary?: boolean;
}) {
	// Note: This component needs Link from tanstack router, imported in the parent
	return (
		<a
			href={href}
			className={cn(
				"group p-6 rounded-2xl border transition-all duration-300 block",
				primary
					? "bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
					: "bg-background border-border/60 hover:border-primary/40",
			)}
		>
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg mb-1">{title}</h3>
					<p
						className={cn(
							"text-sm",
							primary ? "opacity-90" : "text-muted-foreground",
						)}
					>
						{description}
					</p>
				</div>
				<ArrowRight
					className={cn(
						"h-5 w-5 transition-transform group-hover:translate-x-1",
						primary ? "opacity-80" : "text-muted-foreground",
					)}
				/>
			</div>
		</a>
	);
}
