import { z } from "zod";
import {
	LOAN_AMOUNTS,
	LOAN_PURPOSES,
	LOAN_TERMS,
	loanAmountSchema,
	loanPurposeSchema,
	loanTermSchema,
} from "../types/loan";

// Re-export constants for client usage
export { LOAN_AMOUNTS, LOAN_PURPOSES, LOAN_TERMS };

export const loanRequestSchema = z.object({
	amount: loanAmountSchema,
	purpose: loanPurposeSchema,
	term: loanTermSchema,
});
export type LoanRequest = z.infer<typeof loanRequestSchema>;

const loanRequestResponseBaseSchema = z.object({
	requestId: z.string(),
});

export const loanRequestResponseSchema = z.discriminatedUnion("mode", [
	loanRequestResponseBaseSchema.extend({
		mode: z.literal("direct_post"),
		authorizeUrl: z.url(),
	}),
	loanRequestResponseBaseSchema.extend({
		mode: z.literal("dc_api"),
		dcApiRequest: z.record(z.string(), z.unknown()),
	}),
]);
export type LoanRequestResponse = z.infer<typeof loanRequestResponseSchema>;

export const loanStatusResponseSchema = z.object({
	status: z.enum(["pending", "authorized", "rejected", "error", "expired"]),
	loanRequestId: z.string().optional(),
	claims: z
		.object({
			familyName: z.string(),
			givenName: z.string(),
			identifier: z.string(),
		})
		.optional(),
});
export type LoanStatusResponse = z.infer<typeof loanStatusResponseSchema>;

export const loanCompleteRequestSchema = z.object({
	origin: z.string(),
	dcResponse: z.record(z.string(), z.unknown()),
});
export type LoanCompleteRequest = z.infer<typeof loanCompleteRequestSchema>;

export const loanCompleteResponseSchema = z.object({
	loanRequestId: z.string(),
	message: z.string(),
});
export type LoanCompleteResponse = z.infer<typeof loanCompleteResponseSchema>;
