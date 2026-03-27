import { z } from "zod";
import { bookingActorSchema, bookingStatusSchema } from "../types/bookings";
import { eventSchema } from "../types/events";

export const createBookingRequestSchema = z.object({
	eventId: z.string(),
	quantity: z.number().int().positive(),
	delegationId: z.string().optional(),
});

export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;

export const createBookingResponseSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	quantity: z.number(),
	status: bookingStatusSchema,
	bookedBy: bookingActorSchema,
	authorizeUrl: z.string().optional(),
	statusToken: z.string().optional(),
	delegatorName: z.string().optional(),
});

export type CreateBookingResponse = z.infer<typeof createBookingResponseSchema>;

export const bookingStatusResponseSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	quantity: z.number(),
	status: bookingStatusSchema,
	bookedBy: bookingActorSchema,
	delegatorName: z.string().optional(),
	createdAt: z.string(),
	event: eventSchema.optional(),
	errorMessage: z.string().optional(),
});

export type BookingStatusResponse = z.infer<typeof bookingStatusResponseSchema>;

export const bookingListItemSchema = bookingStatusResponseSchema;

export type BookingListItem = z.infer<typeof bookingListItemSchema>;

export const bookingListResponseSchema = z.array(bookingListItemSchema);

export type BookingListResponse = z.infer<typeof bookingListResponseSchema>;
