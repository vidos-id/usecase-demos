import { z } from "zod";

export const eventCategorySchema = z.enum([
	"concert",
	"sports",
	"festival",
	"theatre",
	"comedy",
]);

export type EventCategory = z.infer<typeof eventCategorySchema>;

export const eventSchema = z.object({
	id: z.string(),
	name: z.string(),
	category: eventCategorySchema,
	city: z.string(),
	venue: z.string(),
	date: z.string(),
	priceEur: z.number(),
	availableTickets: z.number().int().gte(0),
	identityVerificationRequired: z.boolean(),
	description: z.string(),
	imagePrompt: z.string(),
});

export type Event = z.infer<typeof eventSchema>;

export const eventListSchema = z.array(eventSchema);
