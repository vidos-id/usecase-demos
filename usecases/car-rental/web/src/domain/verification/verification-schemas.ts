import { z } from "zod";
import {
	MDL_CREDENTIAL_ID,
	MDL_DOC_TYPE,
	MDL_NAMESPACE,
	PID_CREDENTIAL_ID,
} from "@/domain/verification/verification-constants";

export const verificationLifecycleStateSchema = z.enum([
	"created",
	"pending_wallet",
	"processing",
	"success",
	"rejected",
	"expired",
	"error",
]);

export const verificationCredentialKindSchema = z.enum(["mdl", "pid"]);

export const verificationCredentialFormatSchema = z.enum([
	"mso_mdoc",
	"dc+sd-jwt",
]);

export const verificationClaimRequestSchema = z.object({
	id: z.string().min(1),
	path: z.array(z.string().min(1)).min(1),
	required: z.boolean(),
});

const verificationCredentialRequestBaseSchema = z.object({
	id: z.string().min(1),
	kind: verificationCredentialKindSchema,
	format: verificationCredentialFormatSchema,
	required: z.boolean(),
	purpose: z.string().min(1),
	claims: z.array(verificationClaimRequestSchema).min(1),
	meta: z.record(z.string(), z.unknown()).optional(),
});

const mdlClaimRequestSchema = verificationClaimRequestSchema.extend({
	path: z.tuple([z.literal(MDL_NAMESPACE), z.string().min(1)]),
});

const mdlCredentialMetaSchema = z
	.object({
		doctype_value: z.literal(MDL_DOC_TYPE),
	})
	.passthrough();

const mdlCredentialRequestSchema =
	verificationCredentialRequestBaseSchema.extend({
		id: z.literal(MDL_CREDENTIAL_ID),
		kind: z.literal("mdl"),
		format: z.literal("mso_mdoc"),
		claims: z.array(mdlClaimRequestSchema).min(1),
		meta: mdlCredentialMetaSchema,
	});

const pidCredentialRequestSchema =
	verificationCredentialRequestBaseSchema.extend({
		id: z.literal(PID_CREDENTIAL_ID),
		kind: z.literal("pid"),
		format: z.literal("dc+sd-jwt"),
	});

export const verificationCredentialRequestSchema = z.discriminatedUnion(
	"kind",
	[mdlCredentialRequestSchema, pidCredentialRequestSchema],
);

export const verificationRequestSchema = z.object({
	requestId: z.string().min(1),
	bookingId: z.string().min(1),
	nonce: z.string().min(16),
	createdAt: z.string().min(1),
	purpose: z.string().min(1),
	query: z.object({
		type: z.literal("DCQL"),
		credentials: z
			.array(verificationCredentialRequestSchema)
			.min(1)
			.superRefine((credentials, context) => {
				const hasMdl = credentials.some(
					(credential) => credential.id === MDL_CREDENTIAL_ID,
				);
				if (!hasMdl) {
					context.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Verification request must include the mDL credential",
					});
				}

				const uniqueIds = new Set(
					credentials.map((credential) => credential.id),
				);
				if (uniqueIds.size !== credentials.length) {
					context.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Credential IDs must be unique within a request",
					});
				}
			}),
		credentialSets: z
			.array(
				z.object({
					id: z.string().min(1),
					options: z.array(z.array(z.string().min(1)).min(1)).min(1),
				}),
			)
			.optional(),
	}),
});

export const verificationCorrelationSchema = z.object({
	bookingId: z.string().min(1),
	authorizerId: z.string().min(1),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

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

export const verificationPolicyStatusSchema = z.enum([
	"pass",
	"fail",
	"unknown",
]);

export const verificationPolicySchema = z.object({
	overallStatus: verificationPolicyStatusSchema,
	checks: z.array(verificationPolicyCheckSchema),
});

export const normalizedMdlDisclosedClaimsSchema = z.object({
	givenName: z.string().optional(),
	familyName: z.string().optional(),
	birthDate: z.string().optional(),
	documentNumber: z.string().optional(),
	issuingCountry: z.string().optional(),
	issuingAuthority: z.string().optional(),
	expiryDate: z.string().optional(),
	drivingPrivileges: z.array(z.unknown()).optional(),
	portrait: z.string().optional(),
});

export const normalizedPidDisclosedClaimsSchema = z.object({
	givenName: z.string().optional(),
	familyName: z.string().optional(),
	birthDate: z.string().optional(),
	personalAdministrativeNumber: z.string().optional(),
});

export const normalizedDisclosedClaimsSchema = z.object({
	mdl: normalizedMdlDisclosedClaimsSchema,
	pid: normalizedPidDisclosedClaimsSchema.optional(),
});

export const verificationStateSchema = z.object({
	lifecycle: verificationLifecycleStateSchema,
	bookingId: z.string().nullable(),
	authorizerId: z.string().nullable(),
	authorizationUrl: z.string().nullable(),
	request: verificationRequestSchema.nullable(),
	correlation: verificationCorrelationSchema.nullable(),
	policy: verificationPolicySchema.nullable(),
	disclosedClaims: normalizedDisclosedClaimsSchema.nullable(),
	lastError: z.string().nullable(),
	updatedAt: z.string().min(1),
});

export const persistedVerificationStateSchema = z.object({
	version: z.literal(1),
	state: verificationStateSchema,
});

export type VerificationLifecycleState = z.infer<
	typeof verificationLifecycleStateSchema
>;
export type VerificationRequest = z.infer<typeof verificationRequestSchema>;
export type VerificationCorrelation = z.infer<
	typeof verificationCorrelationSchema
>;
export type VerificationPolicy = z.infer<typeof verificationPolicySchema>;
export type NormalizedDisclosedClaims = z.infer<
	typeof normalizedDisclosedClaimsSchema
>;
export type VerificationState = z.infer<typeof verificationStateSchema>;
