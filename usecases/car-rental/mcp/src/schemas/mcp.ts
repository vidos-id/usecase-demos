import {
	bookingLocationSchema,
	bookingVehicleSchema,
	licenceCategorySchema,
	rentalTripContextSchema,
} from "demo-car-rental-shared/types/rental";
import { z } from "zod";

export const rentalSearchResultSchema = z.object({
	vehicle: bookingVehicleSchema,
	totalEstimate: z.number().nonnegative(),
	estimatedDays: z.number().int().min(1),
	reason: z.string().min(1),
});

export const rentalSearchResponseSchema = z.object({
	trip: rentalTripContextSchema,
	results: z.array(rentalSearchResultSchema),
	summary: z.string().min(1),
});

export const rentalEligibilityReasonCodeSchema = z.enum([
	"approved",
	"underage",
	"licence_category_mismatch",
	"licence_expired",
	"authorizer_error",
	"verification_rejected",
	"verification_expired",
]);

export const rentalEligibilitySchema = z.object({
	bookingApproved: z.boolean(),
	minimumAge: z.number().int().min(18),
	minimumAgeMet: z.boolean(),
	requiredLicenceCategory: licenceCategorySchema,
	presentedCategories: z.array(z.string()),
	licenceValid: z.boolean(),
	reasonCode: rentalEligibilityReasonCodeSchema,
	reasonText: z.string().min(1),
});

export const pickupConfirmationSchema = z.object({
	bookingReference: z.string().min(1),
	pickupLocation: bookingLocationSchema,
	lockerId: z.string().min(1),
	lockerPin: z.string().min(4),
	instructions: z.string().min(1),
});

export type RentalSearchResult = z.infer<typeof rentalSearchResultSchema>;
export type RentalSearchResponse = z.infer<typeof rentalSearchResponseSchema>;
export type RentalEligibility = z.infer<typeof rentalEligibilitySchema>;
export type PickupConfirmation = z.infer<typeof pickupConfirmationSchema>;
