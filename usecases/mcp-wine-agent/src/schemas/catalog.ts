import { z } from "zod";

export const WineTypeSchema = z.enum(["red", "white", "rose", "sparkling"]);

export const WineProductSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: WineTypeSchema,
	region: z.string(),
	country: z.string(),
	year: z.number(),
	price: z.number(),
	currency: z.string().default("EUR"),
	description: z.string(),
	tastingNotes: z.string().optional(),
	foodPairing: z.array(z.string()).optional(),
	occasion: z.array(z.string()).optional(),
	qualityTier: z.enum(["entry", "mid", "premium", "luxury"]),
	abv: z.number().optional(),
	ageRestricted: z.literal(true).default(true),
});

export const CartItemSchema = z.object({
	wineId: z.string(),
	quantity: z.number().int().positive(),
});

export const CartSchema = z.object({
	items: z.array(CartItemSchema),
	sessionId: z.string(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const CartSummarySchema = z.object({
	items: z.array(
		z.object({
			wine: WineProductSchema,
			quantity: z.number(),
			lineTotal: z.number(),
		}),
	),
	totalItems: z.number(),
	subtotal: z.number(),
	currency: z.string(),
	requiresVerification: z.boolean(),
	verificationReason: z.string().optional(),
});

export const CheckoutSessionSchema = z.object({
	sessionId: z.string(),
	cart: CartSchema,
	status: z.enum([
		"pending",
		"verification_required",
		"verifying",
		"verified",
		"rejected",
		"expired",
		"error",
		"completed",
	]),
	authorizationId: z.string().optional(),
	verificationUrl: z.string().optional(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const ToolResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	data: z.unknown().optional(),
	content: z.array(z.unknown()).optional(),
});

export type WineType = z.infer<typeof WineTypeSchema>;
export type WineProduct = z.infer<typeof WineProductSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type CartSummary = z.infer<typeof CartSummarySchema>;
export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;
export type ToolResponse = z.infer<typeof ToolResponseSchema>;
