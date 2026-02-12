import { z } from "zod";

export const paymentRequestSchema = z.object({
	recipient: z.string().min(1).max(100),
	amount: z.number().positive(),
	reference: z.string().max(200).optional(),
});
export type PaymentRequest = z.infer<typeof paymentRequestSchema>;

export const paymentRequestResponseSchema = z.object({
	requestId: z.string(),
	authorizeUrl: z.string().url().optional(),
	dcApiRequest: z.record(z.string(), z.unknown()).optional(),
});
export type PaymentRequestResponse = z.infer<
	typeof paymentRequestResponseSchema
>;

export const paymentStatusResponseSchema = z.object({
	status: z.enum(["pending", "authorized", "rejected", "error", "expired"]),
	transactionId: z.string().optional(),
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
	amount: z.number(),
	reference: z.string().optional(),
});
export type PaymentCompleteResponse = z.infer<
	typeof paymentCompleteResponseSchema
>;
