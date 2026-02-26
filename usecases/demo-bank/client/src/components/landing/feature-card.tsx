import type { ReactNode } from "react";

export function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="group p-6 rounded-2xl bg-background border border-border/40 hover:border-primary/30 transition-colors duration-300">
			<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors duration-300">
				{icon}
			</div>
			<h3 className="text-base font-semibold mb-2">{title}</h3>
			<p className="text-sm text-muted-foreground leading-relaxed">
				{description}
			</p>
		</div>
	);
}
