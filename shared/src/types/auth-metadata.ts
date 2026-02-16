import { z } from "zod";

export const paymentAuthMetadataSchema = z.object({
	transactionId: z.string(),
	recipient: z.string(),
	amount: z.string(),
	reference: z.string().optional(),
});

export const loanAuthMetadataSchema = z.object({
	amount: z.string(),
	purpose: z.string(),
	term: z.string(),
});

export const profileUpdateAuthMetadataSchema = z.object({
	requestedClaims: z.array(z.string()),
	userId: z.string(),
});

export type PaymentAuthMetadata = z.infer<typeof paymentAuthMetadataSchema>;
export type LoanAuthMetadata = z.infer<typeof loanAuthMetadataSchema>;
export type ProfileUpdateAuthMetadata = z.infer<
	typeof profileUpdateAuthMetadataSchema
>;
