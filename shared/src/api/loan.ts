import { z } from "zod";
import { dcApiRequestSchema } from "../types/auth";
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

const loanRequestBaseSchema = z.object({
	amount: loanAmountSchema,
	purpose: loanPurposeSchema,
	term: loanTermSchema,
});

export const loanRequestSchema = z.discriminatedUnion("mode", [
	loanRequestBaseSchema.extend({
		mode: z.literal("direct_post"),
	}),
	loanRequestBaseSchema.extend({
		mode: z.literal("dc_api"),
		origin: z.string().url(),
	}),
]);
export type LoanRequest = z.infer<typeof loanRequestSchema>;

const loanRequestResponseBaseSchema = z.object({
	requestId: z.string(),
});

export const loanRequestResponseSchema = z.discriminatedUnion("mode", [
	loanRequestResponseBaseSchema.extend({
		mode: z.literal("direct_post"),
		authorizeUrl: z.url(),
		requestedClaims: z.array(z.string()),
		purpose: z.string(),
	}),
	loanRequestResponseBaseSchema.extend({
		mode: z.literal("dc_api"),
		dcApiRequest: dcApiRequestSchema,
		requestedClaims: z.array(z.string()),
		purpose: z.string(),
	}),
]);
export type LoanRequestResponse = z.infer<typeof loanRequestResponseSchema>;

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
