import { cn } from "@/lib/utils";

interface TwoColumnLayoutProps {
	/** Left column content (sidebar on desktop) */
	left: React.ReactNode;
	/** Right column content (main on desktop) */
	right: React.ReactNode;
	/** Column ratio - "equal" (1:1) or "wide-right" (2:3) */
	ratio?: "equal" | "wide-right";
	/** Reverse order on mobile (show right first) */
	mobileRightFirst?: boolean;
	className?: string;
}

export function TwoColumnLayout({
	left,
	right,
	ratio = "equal",
	mobileRightFirst = false,
	className,
}: TwoColumnLayoutProps) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-6 lg:gap-8",
				ratio === "equal" && "lg:grid-cols-2",
				ratio === "wide-right" && "lg:grid-cols-5",
				className,
			)}
		>
			<div
				className={cn(
					ratio === "wide-right" && "lg:col-span-2",
					mobileRightFirst && "order-2 lg:order-1",
				)}
			>
				{left}
			</div>
			<div
				className={cn(
					ratio === "wide-right" && "lg:col-span-3",
					mobileRightFirst && "order-1 lg:order-2",
				)}
			>
				{right}
			</div>
		</div>
	);
}
