import { z } from "zod";

export const LOAN_AMOUNTS = [5000, 10000, 25000, 50000] as const;
export const LOAN_PURPOSES = [
	"Car",
	"Home Improvement",
	"Education",
	"Other",
] as const;
export const LOAN_TERMS = [12, 24, 36, 48] as const;

export const loanRequestSchema = z.object({
	amount: z.enum(["5000", "10000", "25000", "50000"]),
	purpose: z.enum(["Car", "Home Improvement", "Education", "Other"]),
	term: z.enum(["12", "24", "36", "48"]),
});
export type LoanRequest = z.infer<typeof loanRequestSchema>;

export const loanRequestResponseSchema = z.object({
	requestId: z.string(),
	authorizeUrl: z.string().url().optional(),
	dcApiRequest: z.record(z.string(), z.unknown()).optional(),
});
export type LoanRequestResponse = z.infer<typeof loanRequestResponseSchema>;

export const loanStatusResponseSchema = z.object({
	status: z.enum(["pending", "authorized", "rejected", "error", "expired"]),
	loanRequestId: z.string().optional(),
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
