import { z } from "zod";
import { eventCategorySchema, eventSchema } from "../types/events";

export const eventSearchParamsSchema = z.object({
	category: eventCategorySchema.optional(),
	city: z.string().optional(),
});

export type EventSearchParams = z.infer<typeof eventSearchParamsSchema>;

export const eventListResponseSchema = z.object({
	events: z.array(eventSchema),
});

export type EventListResponse = z.infer<typeof eventListResponseSchema>;

export const eventDetailResponseSchema = eventSchema;
export type EventDetailResponse = z.infer<typeof eventDetailResponseSchema>;
