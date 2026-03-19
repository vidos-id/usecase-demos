import { z } from "zod";

export const verificationLifecycleStateSchema = z.enum([
	"created",
	"pending_wallet",
	"processing",
	"success",
	"rejected",
	"expired",
	"error",
]);

export const verificationPolicyCheckStatusSchema = z.enum([
	"pass",
	"fail",
	"unknown",
]);

export const verificationPolicyCheckSchema = z.object({
	id: z.string().min(1),
	status: verificationPolicyCheckStatusSchema,
	message: z.string().optional(),
	path: z.array(z.union([z.string(), z.number()])),
});

export const verificationPolicySchema = z.object({
	overallStatus: z.enum(["pass", "fail", "unknown"]),
	checks: z.array(verificationPolicyCheckSchema),
});

export const normalizedPidClaimsSchema = z.object({
	givenName: z.string().optional(),
	familyName: z.string().optional(),
	birthDate: z.string().optional(),
	portrait: z.string().optional(),
	ageInYears: z.number().int().nonnegative().optional(),
	ageEqualOrOver: z.record(z.string(), z.boolean()).optional(),
});
