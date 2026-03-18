import { z } from "zod";

export const licenceCategorySchema = z.enum(["A", "B", "C", "C1", "D"]);

export const transmissionSchema = z.enum(["Automatic", "Manual"]);

export const fuelTypeSchema = z.enum([
	"Petrol",
	"Electric",
	"Hybrid",
	"Diesel",
]);

export const rentalVehicleSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	brand: z.string().min(1),
	category: z.string().min(1),
	requiredLicenceCategory: licenceCategorySchema,
	minimumDriverAge: z.number().int().min(18),
	transmission: transmissionSchema,
	seats: z.number().int().min(1),
	pricePerDay: z.number().nonnegative(),
	fuelType: fuelTypeSchema,
	imagePath: z.string().min(1),
	features: z.array(z.string().min(1)).min(1),
	comparisonHighlights: z.array(z.string().min(1)).min(1),
});

export const bookingLocationSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	code: z.string().min(1),
});

export const bookingVehicleSchema = rentalVehicleSchema
	.pick({
		id: true,
		name: true,
		category: true,
		requiredLicenceCategory: true,
		minimumDriverAge: true,
		pricePerDay: true,
		imagePath: true,
	})
	.extend({
		currency: z.literal("EUR"),
	});

export const rentalTripContextSchema = z.object({
	destination: z.string().min(1),
	pickupDate: z.string().optional(),
	dropoffDate: z.string().optional(),
	passengerCount: z.number().int().min(1).optional(),
	needsLargeLuggageSpace: z.boolean().optional(),
	prefersAutomatic: z.boolean().optional(),
});

export type LicenceCategory = z.infer<typeof licenceCategorySchema>;
export type Transmission = z.infer<typeof transmissionSchema>;
export type FuelType = z.infer<typeof fuelTypeSchema>;
export type RentalVehicle = z.infer<typeof rentalVehicleSchema>;
export type BookingLocation = z.infer<typeof bookingLocationSchema>;
export type BookingVehicle = z.infer<typeof bookingVehicleSchema>;
export type RentalTripContext = z.infer<typeof rentalTripContextSchema>;
