import { cn } from "@/lib/utils";

type EventImageOrientation = "landscape" | "panorama" | "portrait" | "square";
type EventImageVariant = "card" | "hero";

const imageOrientations: Record<string, EventImageOrientation> = {
	"evt-001": "portrait",
	"evt-002": "landscape",
	"evt-003": "portrait",
	"evt-004": "landscape",
	"evt-005": "landscape",
	"evt-006": "portrait",
	"evt-007": "landscape",
	"evt-008": "panorama",
	"evt-009": "square",
	"evt-010": "panorama",
	"evt-011": "panorama",
	"evt-012": "panorama",
	"evt-013": "panorama",
	"evt-014": "panorama",
	"evt-015": "panorama",
	"evt-016": "panorama",
	"evt-017": "panorama",
	"evt-018": "panorama",
	"evt-019": "panorama",
	"evt-020": "panorama",
};

const objectPositions: Record<
	EventImageVariant,
	Record<EventImageOrientation, string>
> = {
	card: {
		landscape: "50% 50%",
		panorama: "50% 50%",
		portrait: "50% 20%",
		square: "50% 50%",
	},
	hero: {
		landscape: "50% 50%",
		panorama: "50% 50%",
		portrait: "50% 18%",
		square: "50% 50%",
	},
};

export function getEventImageMeta(eventId: string) {
	const baseUrl = import.meta.env.BASE_URL ?? "/";
	const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
	const imagePath = `event-images/${eventId}.jpeg`;

	return {
		src: `${normalizedBaseUrl}${imagePath}`,
		orientation: imageOrientations[eventId] ?? "landscape",
	};
}

export function EventImage({
	eventId,
	eventName,
	variant = "card",
	className,
	imageClassName,
	priority = false,
}: {
	eventId: string;
	eventName: string;
	variant?: EventImageVariant;
	className?: string;
	imageClassName?: string;
	priority?: boolean;
}) {
	const { src, orientation } = getEventImageMeta(eventId);

	return (
		<div
			className={cn(
				"relative h-full w-full overflow-hidden bg-slate-100",
				className,
			)}
		>
			<img
				alt={eventName}
				className={cn(
					"h-full w-full object-cover transition-transform duration-700",
					variant === "card" && "group-hover:scale-[1.04]",
					imageClassName,
				)}
				decoding="async"
				fetchPriority={priority ? "high" : "auto"}
				loading={priority ? "eager" : "lazy"}
				src={src}
				style={{ objectPosition: objectPositions[variant][orientation] }}
			/>
		</div>
	);
}
