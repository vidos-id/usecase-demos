import { z } from "zod";
import { bookingStatusSchema } from "../types/bookings";
import { eventSchema } from "../types/events";

export const createBookingRequestSchema = z.object({
	eventId: z.string(),
	quantity: z.number().int().positive(),
});

export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;

export const createBookingResponseSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	quantity: z.number(),
	status: bookingStatusSchema,
	authorizeUrl: z.string().optional(),
	delegatorName: z.string().optional(),
});

export type CreateBookingResponse = z.infer<typeof createBookingResponseSchema>;

export const bookingStatusResponseSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	quantity: z.number(),
	status: bookingStatusSchema,
	delegatorName: z.string().optional(),
	createdAt: z.string(),
	event: eventSchema.optional(),
	errorMessage: z.string().optional(),
});

export type BookingStatusResponse = z.infer<typeof bookingStatusResponseSchema>;
