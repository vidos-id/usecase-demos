import { z } from "zod";
import { dcApiRequestSchema } from "../types/auth";

// EUR amount format: digits with exactly 2 decimal places
export const eurAmountSchema = z.string().regex(/^\d+\.\d{2}$/, {
	error: "Amount must be in EUR format (e.g., '100.00')",
});

const paymentRequestBaseSchema = z.object({
	recipient: z.string().min(1).max(100),
	amount: eurAmountSchema,
	reference: z.string().max(200).optional(),
});

export const paymentRequestSchema = z.discriminatedUnion("mode", [
	paymentRequestBaseSchema.extend({
		mode: z.literal("direct_post"),
	}),
	paymentRequestBaseSchema.extend({
		mode: z.literal("dc_api"),
		origin: z.url(),
	}),
]);
export type PaymentRequest = z.infer<typeof paymentRequestSchema>;

const paymentRequestResponseBaseSchema = z.object({
	requestId: z.string(),
	transactionId: z.string(),
});

export const paymentRequestResponseSchema = z.discriminatedUnion("mode", [
	paymentRequestResponseBaseSchema.extend({
		mode: z.literal("direct_post"),
		authorizeUrl: z.url(),
		requestedClaims: z.array(z.string()),
		purpose: z.string(),
	}),
	paymentRequestResponseBaseSchema.extend({
		mode: z.literal("dc_api"),
		dcApiRequest: dcApiRequestSchema,
		requestedClaims: z.array(z.string()),
		purpose: z.string(),
	}),
]);
export type PaymentRequestResponse = z.infer<
	typeof paymentRequestResponseSchema
>;

export const paymentStatusResponseSchema = z.object({
	status: z.enum(["pending", "authorized", "rejected", "error", "expired"]),
	transactionId: z.string().optional(),
	claims: z
		.object({
			familyName: z.string(),
			givenName: z.string(),
			identifier: z.string(),
		})
		.optional(),
});
export type PaymentStatusResponse = z.infer<typeof paymentStatusResponseSchema>;

export const paymentCompleteRequestSchema = z.object({
	origin: z.string(),
	dcResponse: z.record(z.string(), z.unknown()),
});
export type PaymentCompleteRequest = z.infer<
	typeof paymentCompleteRequestSchema
>;

export const paymentCompleteResponseSchema = z.object({
	transactionId: z.string(),
	confirmedAt: z.string(),
	recipient: z.string(),
	amount: z.string(),
	reference: z.string().optional(),
	verifiedIdentity: z.object({
		familyName: z.string(),
		givenName: z.string(),
		identifier: z.string(),
	}),
	transaction: z.object({
		id: z.string(),
		recipient: z.string(),
		amount: z.string(),
		reference: z.string().optional(),
		confirmedAt: z.string(),
	}),
});
export type PaymentCompleteResponse = z.infer<
	typeof paymentCompleteResponseSchema
>;
