import { z } from "zod";

// Request schema for resolving a response_code
export const callbackResolveRequestSchema = z.object({
	response_code: z.string().min(1, "response_code is required"),
});

const paymentTransactionDetailsSchema = z.object({
	type: z.literal("payment"),
	recipient: z.string(),
	amount: z.number(),
	reference: z.string().optional(),
});

const loanTransactionDetailsSchema = z.object({
	type: z.literal("loan"),
	loanAmount: z.number(),
	loanPurpose: z.string(),
	loanTerm: z.number(),
});

export const transactionDetailsSchema = z.discriminatedUnion("type", [
	paymentTransactionDetailsSchema,
	loanTransactionDetailsSchema,
]);

// Error info for failed/rejected authorizations
export const callbackErrorInfoSchema = z.object({
	errorType: z.string().optional(),
	title: z.string(),
	detail: z.string().optional(),
});

// Response schema for resolved callback
export const callbackResolveResponseSchema = z.object({
	// Application-level status (what the server concluded)
	status: z.enum(["completed", "failed", "pending"]),
	// Vidos authorization status (relevant when status=pending to show what Vidos concluded)
	vidosStatus: z
		.enum(["authorized", "rejected", "error", "expired"])
		.optional(),

	// Flow type that was being processed
	flowType: z.enum(["signup", "signin", "payment", "loan", "profile_update"]),

	// When the authorization was completed (null if still pending)
	completedAt: z.string().nullable(),

	// Transaction metadata (for loan/payment flows)
	transactionDetails: transactionDetailsSchema.optional(),

	// Error info (for failed/rejected)
	errorInfo: callbackErrorInfoSchema.optional(),
});

// Type exports
export type CallbackResolveRequest = z.infer<
	typeof callbackResolveRequestSchema
>;
export type CallbackResolveResponse = z.infer<
	typeof callbackResolveResponseSchema
>;
export type TransactionDetails = z.infer<typeof transactionDetailsSchema>;
export type CallbackErrorInfo = z.infer<typeof callbackErrorInfoSchema>;
