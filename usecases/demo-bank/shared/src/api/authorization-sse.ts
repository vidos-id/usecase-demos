import { z } from "zod";
import { presentationModeSchema } from "../types/auth";
import { authorizationErrorInfoSchema } from "../types/vidos-errors";

export const authorizationFlowTypeSchema = z.enum([
	"signup",
	"signin",
	"payment",
	"loan",
	"profile_update",
]);
export type AuthorizationFlowType = z.infer<typeof authorizationFlowTypeSchema>;

export const authorizationConnectedEventSchema = z.object({
	eventType: z.literal("connected"),
});
export type AuthorizationConnectedEvent = z.infer<
	typeof authorizationConnectedEventSchema
>;

export const authorizationPendingEventSchema = z.object({
	eventType: z.literal("pending"),
});
export type AuthorizationPendingEvent = z.infer<
	typeof authorizationPendingEventSchema
>;

export const authorizationAuthorizedEventSchema = z.object({
	eventType: z.literal("authorized"),
	sessionId: z.string().optional(),
	mode: presentationModeSchema.optional(),
	transactionId: z.string().optional(),
	loanRequestId: z.string().optional(),
	updatedFields: z.array(z.string()).optional(),
});
export type AuthorizationAuthorizedEvent = z.infer<
	typeof authorizationAuthorizedEventSchema
>;

export const authorizationExpiredEventSchema = z.object({
	eventType: z.literal("expired"),
});
export type AuthorizationExpiredEvent = z.infer<
	typeof authorizationExpiredEventSchema
>;

export const authorizationNotFoundEventSchema = z.object({
	eventType: z.literal("not_found"),
	message: z.string(),
});
export type AuthorizationNotFoundEvent = z.infer<
	typeof authorizationNotFoundEventSchema
>;

export const authorizationAccountExistsEventSchema = z.object({
	eventType: z.literal("account_exists"),
	message: z.string(),
});
export type AuthorizationAccountExistsEvent = z.infer<
	typeof authorizationAccountExistsEventSchema
>;

export const authorizationRejectedEventSchema = z.object({
	eventType: z.literal("rejected"),
	message: z.string(),
	errorInfo: authorizationErrorInfoSchema.optional(),
});
export type AuthorizationRejectedEvent = z.infer<
	typeof authorizationRejectedEventSchema
>;

export const authorizationErrorEventSchema = z.object({
	eventType: z.literal("error"),
	code: z.string().optional(),
	message: z.string(),
	errorInfo: authorizationErrorInfoSchema.optional(),
});
export type AuthorizationErrorEvent = z.infer<
	typeof authorizationErrorEventSchema
>;

export const authorizationStreamEventNameSchema = z.enum([
	"connected",
	"pending",
	"authorized",
	"expired",
	"not_found",
	"account_exists",
	"rejected",
	"error",
]);
export type AuthorizationStreamEventName = z.infer<
	typeof authorizationStreamEventNameSchema
>;

export const authorizationStreamEventNames: AuthorizationStreamEventName[] = [
	"connected",
	"pending",
	"authorized",
	"expired",
	"not_found",
	"account_exists",
	"rejected",
	"error",
];

export const authorizationStreamEventSchema = z.discriminatedUnion(
	"eventType",
	[
		authorizationConnectedEventSchema,
		authorizationPendingEventSchema,
		authorizationAuthorizedEventSchema,
		authorizationExpiredEventSchema,
		authorizationNotFoundEventSchema,
		authorizationAccountExistsEventSchema,
		authorizationRejectedEventSchema,
		authorizationErrorEventSchema,
	],
);
export type AuthorizationStreamEvent = z.infer<
	typeof authorizationStreamEventSchema
>;
