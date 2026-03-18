import { z } from "zod";
import { bookingConfirmationPayloadSchema } from "@/domain/booking/booking-confirmation";

export const bookingLifecycleStatusSchema = z.enum([
	"draft",
	"reviewed",
	"awaiting_verification",
	"verified",
	"payment_confirmed",
	"completed",
	"failed",
]);

export const bookingLocationSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	code: z.string().min(1),
});

export const bookingVehicleSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	category: z.string().min(1),
	pricePerDay: z.number().finite(),
	currency: z.literal("EUR"),
});

export const bookingRentalDetailsSchema = z.object({
	location: bookingLocationSchema.nullable(),
	pickupDateTime: z.string().nullable(),
	dropoffDateTime: z.string().nullable(),
	selectedVehicle: bookingVehicleSchema.nullable(),
});

export const bookingStateSchema = z.object({
	status: bookingLifecycleStatusSchema,
	bookingId: z.string().nullable(),
	rentalDetails: bookingRentalDetailsSchema,
	confirmation: bookingConfirmationPayloadSchema.nullable(),
	updatedAt: z.string().min(1),
	lastError: z.string().nullable(),
});

export const persistedBookingStateSchema = z.object({
	version: z.literal(2),
	state: bookingStateSchema,
});

export type BookingStateModel = z.infer<typeof bookingStateSchema>;
