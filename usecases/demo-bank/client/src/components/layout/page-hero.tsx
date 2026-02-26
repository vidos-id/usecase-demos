interface PageHeroProps {
	/** Icon component to display */
	icon: React.ReactNode;
	/** Page title */
	title: string;
	/** Page description */
	description: string;
}

export function PageHero({ icon, title, description }: PageHeroProps) {
	return (
		<div className="text-center space-y-2">
			<div className="inline-flex items-center justify-center h-14 w-14 lg:h-16 lg:w-16 rounded-2xl bg-primary/10 mb-2">
				{icon}
			</div>
			<h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
			<p className="text-muted-foreground lg:text-lg">{description}</p>
		</div>
	);
}
