import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
	/** Link destination, defaults to /dashboard */
	backTo?: string;
	/** Back button label, defaults to "Dashboard" */
	backLabel?: string;
	/** Optional callback for custom back behavior (e.g., state change) */
	onBack?: () => void;
	/** Optional right-side content (e.g., badge) */
	rightContent?: React.ReactNode;
}

export function PageHeader({
	backTo = "/dashboard",
	backLabel = "Dashboard",
	onBack,
	rightContent,
}: PageHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			{onBack ? (
				<Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
					<ArrowLeft className="h-4 w-4" />
					{backLabel}
				</Button>
			) : (
				<Button asChild variant="ghost" size="sm" className="gap-2">
					<Link to={backTo}>
						<ArrowLeft className="h-4 w-4" />
						{backLabel}
					</Link>
				</Button>
			)}
			{rightContent}
		</div>
	);
}
