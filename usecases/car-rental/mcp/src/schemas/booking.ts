import {
	bookingLocationSchema,
	bookingVehicleSchema,
	rentalTripContextSchema,
} from "demo-car-rental-shared/types/rental";
import { z } from "zod";
import {
	pickupConfirmationSchema,
	rentalEligibilitySchema,
	rentalSearchResponseSchema,
} from "@/schemas/mcp";

export const verificationLifecycleSchema = z.enum([
	"created",
	"pending_wallet",
	"processing",
	"success",
	"rejected",
	"expired",
	"error",
]);

export const bookingStatusSchema = z.enum([
	"search_ready",
	"car_selected",
	"verification_required",
	"verification_in_progress",
	"approved",
	"rejected",
	"expired",
	"error",
]);

export const verificationSnapshotSchema = z.object({
	verificationSessionId: z.string(),
	authorizationId: z.string().nullable(),
	authorizationUrl: z.string().nullable(),
	lifecycle: verificationLifecycleSchema,
	lastError: z.string().nullable(),
	updatedAt: z.string(),
});

export const bookingSnapshotSchema = z.object({
	bookingSessionId: z.string(),
	status: bookingStatusSchema,
	destination: z.string(),
	trip: rentalTripContextSchema,
	selectedVehicle: bookingVehicleSchema.nullable(),
	pickupLocation: bookingLocationSchema,
	requirements: z
		.object({
			minimumAge: z.number().int().min(18),
			requiredLicenceCategory: z.string().min(1),
		})
		.nullable(),
	verification: verificationSnapshotSchema.nullable(),
	eligibility: rentalEligibilitySchema.nullable(),
	confirmation: pickupConfirmationSchema.nullable(),
	updatedAt: z.string(),
});

export const searchCarsToolDataSchema = z.object({
	search: rentalSearchResponseSchema,
	bookingSessionId: z.string(),
});

export const bookingToolDataSchema = z.object({
	booking: bookingSnapshotSchema,
	widgetUri: z.string().optional(),
	qrCodeDataUrl: z.string().optional(),
});

export type VerificationLifecycle = z.infer<typeof verificationLifecycleSchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type VerificationSnapshot = z.infer<typeof verificationSnapshotSchema>;
export type BookingSnapshot = z.infer<typeof bookingSnapshotSchema>;
export type SearchCarsToolData = z.infer<typeof searchCarsToolDataSchema>;
export type BookingToolData = z.infer<typeof bookingToolDataSchema>;
