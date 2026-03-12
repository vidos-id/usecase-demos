import { z } from "zod";

export const VerificationLifecycleStateSchema = z.enum([
	"created",
	"pending_wallet",
	"processing",
	"authorized",
	"completed",
	"success",
	"rejected",
	"expired",
	"error",
]);

export const VerificationPolicyCheckStatusSchema = z.enum([
	"pass",
	"fail",
	"unknown",
]);

export const VerificationPolicyCheckSchema = z.object({
	id: z.string(),
	status: VerificationPolicyCheckStatusSchema,
	message: z.string().optional(),
	path: z.array(z.union([z.string(), z.number()])),
});

export const VerificationPolicySchema = z.object({
	overallStatus: z.enum(["pass", "fail", "unknown"]),
	checks: z.array(VerificationPolicyCheckSchema),
});

export const NormalizedPidClaimsSchema = z.object({
	givenName: z.string().nullable(),
	familyName: z.string().nullable(),
	birthDate: z.string().nullable(),
	portrait: z.string().nullable(),
});

export const AgeCheckResultSchema = z.object({
	eligible: z.boolean(),
	requiredAge: z.number(),
	actualAge: z.number().nullable(),
	birthDate: z.string().nullable(),
});

export const VerificationStateSchema = z.object({
	lifecycle: VerificationLifecycleStateSchema,
	authorizationId: z.string().nullable(),
	authorizationUrl: z.string().nullable(),
	policy: VerificationPolicySchema.nullable(),
	disclosedClaims: NormalizedPidClaimsSchema.nullable(),
	ageCheck: AgeCheckResultSchema.nullable(),
	lastError: z.string().nullable(),
	updatedAt: z.string().datetime(),
});

export const CheckoutSessionSchema = z.object({
	sessionId: z.string(),
	cartSessionId: z.string(),
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
	verification: VerificationStateSchema.nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type VerificationLifecycleState = z.infer<
	typeof VerificationLifecycleStateSchema
>;
export type VerificationPolicyCheckStatus = z.infer<
	typeof VerificationPolicyCheckStatusSchema
>;
export type VerificationPolicyCheck = z.infer<
	typeof VerificationPolicyCheckSchema
>;
export type VerificationPolicy = z.infer<typeof VerificationPolicySchema>;
export type NormalizedPidClaims = z.infer<typeof NormalizedPidClaimsSchema>;
export type AgeCheckResult = z.infer<typeof AgeCheckResultSchema>;
export type VerificationState = z.infer<typeof VerificationStateSchema>;
export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;
