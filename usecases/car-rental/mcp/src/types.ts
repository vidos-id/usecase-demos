import {
	bookingLocationSchema,
	bookingVehicleSchema,
	licenceCategorySchema,
	rentalTripContextSchema,
} from "demo-car-rental-shared/types/rental";
import { z } from "zod";

export const verificationLifecycleSchema = z.enum([
	"created",
	"pending_wallet",
	"processing",
	"success",
	"rejected",
	"expired",
	"error",
]);
export type VerificationLifecycle = z.infer<typeof verificationLifecycleSchema>;

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
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const verificationSnapshotSchema = z.object({
	verificationSessionId: z.string(),
	authorizationId: z.string().nullable(),
	authorizationUrl: z.string().nullable(),
	lifecycle: verificationLifecycleSchema,
	lastError: z.string().nullable(),
	updatedAt: z.string(),
});
export type VerificationSnapshot = z.infer<typeof verificationSnapshotSchema>;

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

export type RentalSearchResult = z.infer<typeof rentalSearchResultSchema>;
export type RentalSearchResponse = z.infer<typeof rentalSearchResponseSchema>;
export type RentalEligibility = z.infer<typeof rentalEligibilitySchema>;
export type PickupConfirmation = z.infer<typeof pickupConfirmationSchema>;
export type BookingSnapshot = z.infer<typeof bookingSnapshotSchema>;

export interface BookingView {
	bookingSessionId: string;
	status: BookingStatus;
	destination: string;
	selectedVehicle: BookingVehicle | null;
	requirements: { requiredLicenceCategory: string } | null;
	verification: {
		lifecycle: VerificationLifecycle;
		lastError: string | null;
	} | null;
	eligibility: {
		bookingApproved: boolean;
		requiredLicenceCategory: string;
		presentedCategories: string[];
		reasonCode: string;
		reasonText: string;
	} | null;
	confirmation: {
		bookingReference: string;
		pickupLocation: { name: string };
		lockerId: string;
		lockerPin: string;
		instructions: string;
	} | null;
}

export interface BookingVehicle {
	id: string;
	name: string;
	brand: string;
	category: string;
	requiredLicenceCategory: string;
	minimumDriverAge: number;
	transmission: string;
	seats: number;
	pricePerDay: number;
	fuelType: string;
	imagePath: string;
	features: string[];
	comparisonHighlights: string[];
	currency: "EUR";
}
