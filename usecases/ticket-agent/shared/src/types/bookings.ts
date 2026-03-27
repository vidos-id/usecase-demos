import { z } from "zod";

export const bookingStatusSchema = z.enum([
	"pending_verification",
	"verified",
	"confirmed",
	"rejected",
	"expired",
	"error",
]);

export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const bookingActorSchema = z.enum(["user", "agent"]);

export type BookingActor = z.infer<typeof bookingActorSchema>;

export const bookingSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	quantity: z.number().int().positive(),
	status: bookingStatusSchema,
	bookedBy: bookingActorSchema,
	delegatorName: z.string().optional(),
	createdAt: z.string(),
	authorizationId: z.string().optional(),
	statusToken: z.string().optional(),
	userId: z.string().optional(),
	errorMessage: z.string().optional(),
});

export type Booking = z.infer<typeof bookingSchema>;
