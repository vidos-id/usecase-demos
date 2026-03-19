import { z } from "zod";

export const wineTypeSchema = z.enum(["red", "white", "rose", "sparkling"]);

export const wineQualityTierSchema = z.enum([
	"entry",
	"mid",
	"premium",
	"luxury",
]);

export const wineProductSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	type: wineTypeSchema,
	region: z.string().min(1),
	country: z.string().min(1),
	year: z.number().int(),
	price: z.number().nonnegative(),
	currency: z.literal("EUR"),
	description: z.string().min(1),
	tastingNotes: z.string().min(1).optional(),
	foodPairing: z.array(z.string().min(1)).optional(),
	occasion: z.array(z.string().min(1)).optional(),
	qualityTier: wineQualityTierSchema,
	abv: z.number().nonnegative().optional(),
	ageRestricted: z.literal(true),
});

export const cartItemSchema = z.object({
	wineId: z.string().min(1),
	quantity: z.number().int().positive(),
});

export const cartSchema = z.object({
	items: z.array(cartItemSchema),
	sessionId: z.string().min(1),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const cartSummarySchema = z.object({
	items: z.array(
		z.object({
			wine: wineProductSchema,
			quantity: z.number().int().positive(),
			lineTotal: z.number().nonnegative(),
		}),
	),
	totalItems: z.number().int().nonnegative(),
	subtotal: z.number().nonnegative(),
	currency: z.literal("EUR"),
	requiresVerification: z.boolean(),
	verificationReason: z.string().optional(),
});

export type WineType = z.infer<typeof wineTypeSchema>;
export type WineQualityTier = z.infer<typeof wineQualityTierSchema>;
export type WineProduct = z.infer<typeof wineProductSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type CartSummary = z.infer<typeof cartSummarySchema>;
