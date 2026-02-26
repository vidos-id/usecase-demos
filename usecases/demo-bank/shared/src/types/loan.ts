import { z } from "zod";

// Loan amount options (EUR)
export const LOAN_AMOUNTS = [5000, 10000, 25000, 50000] as const;
export type LoanAmount = (typeof LOAN_AMOUNTS)[number];
export const loanAmountSchema = z.enum(["5000", "10000", "25000", "50000"]);

// Loan purposes
export const LOAN_PURPOSES = [
	"Car",
	"Home Improvement",
	"Education",
	"Other",
] as const;
export type LoanPurpose = (typeof LOAN_PURPOSES)[number];
export const loanPurposeSchema = z.enum([
	"Car",
	"Home Improvement",
	"Education",
	"Other",
]);

// Loan terms in months
export const LOAN_TERMS = [12, 24, 36, 48] as const;
export type LoanTerm = (typeof LOAN_TERMS)[number];
export const loanTermSchema = z.enum(["12", "24", "36", "48"]);

// Loan request mode - uses existing presentation mode
export { presentationModeSchema } from "./auth";
