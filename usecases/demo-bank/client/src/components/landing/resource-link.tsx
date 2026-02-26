import type { ReactNode } from "react";

export function ResourceLink({
	href,
	icon,
	label,
}: {
	href: string;
	icon: ReactNode;
	label: string;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="group flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
		>
			{icon}
			<span className="font-medium">{label}</span>
		</a>
	);
}
