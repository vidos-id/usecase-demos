import {
	bookingLocationSchema,
	bookingVehicleSchema,
	licenceCategorySchema,
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

export const bookingViewSchema = z.object({
	bookingSessionId: z.string(),
	status: bookingStatusSchema,
	destination: z.string(),
	selectedVehicle: bookingVehicleSchema.nullable(),
	requirements: z
		.object({
			requiredLicenceCategory: z.string().min(1),
		})
		.nullable(),
	verification: z
		.object({
			lifecycle: verificationLifecycleSchema,
			lastError: z.string().nullable(),
		})
		.nullable(),
	eligibility: z
		.object({
			bookingApproved: z.boolean(),
			requiredLicenceCategory: licenceCategorySchema,
			presentedCategories: z.array(z.string()),
			reasonCode: rentalEligibilitySchema.shape.reasonCode,
			reasonText: z.string().min(1),
		})
		.nullable(),
	confirmation: z
		.object({
			bookingReference: z.string().min(1),
			pickupLocation: z.object({
				name: bookingLocationSchema.shape.name,
			}),
			lockerId: z.string().min(1),
			lockerPin: z.string().min(4),
			instructions: z.string().min(1),
		})
		.nullable(),
});

export const searchCarsResultSchema = z.object({
	bookingSessionId: z.string(),
	results: rentalSearchResponseSchema.shape.results,
});

export const bookingResultSchema = z.object({
	booking: bookingViewSchema,
	widgetUri: z.string().optional(),
	authorizationUrl: z.string().nullable().optional(),
});

export type VerificationLifecycle = z.infer<typeof verificationLifecycleSchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type VerificationSnapshot = z.infer<typeof verificationSnapshotSchema>;
export type BookingSnapshot = z.infer<typeof bookingSnapshotSchema>;
export type BookingView = z.infer<typeof bookingViewSchema>;
export type SearchCarsResult = z.infer<typeof searchCarsResultSchema>;
export type BookingResult = z.infer<typeof bookingResultSchema>;
