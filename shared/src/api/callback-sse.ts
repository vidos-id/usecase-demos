import { z } from "zod";
import { callbackResolveResponseSchema } from "./callback";

export const callbackSseStateSchema = callbackResolveResponseSchema.extend({
	responseCode: z.string(),
	authorizationId: z.string(),
});
export type CallbackSseState = z.infer<typeof callbackSseStateSchema>;

export const callbackSseConnectedEventSchema = z.object({
	eventType: z.literal("connected"),
});
export type CallbackSseConnectedEvent = z.infer<
	typeof callbackSseConnectedEventSchema
>;

export const callbackSsePendingEventSchema = callbackSseStateSchema.extend({
	eventType: z.literal("pending"),
	status: z.literal("pending"),
});
export type CallbackSsePendingEvent = z.infer<
	typeof callbackSsePendingEventSchema
>;

export const callbackSseCompletedEventSchema = callbackSseStateSchema.extend({
	eventType: z.literal("completed"),
	status: z.literal("completed"),
});
export type CallbackSseCompletedEvent = z.infer<
	typeof callbackSseCompletedEventSchema
>;

export const callbackSseFailedEventSchema = callbackSseStateSchema.extend({
	eventType: z.literal("failed"),
	status: z.literal("failed"),
});
export type CallbackSseFailedEvent = z.infer<
	typeof callbackSseFailedEventSchema
>;

export const callbackSseErrorEventSchema = z.object({
	eventType: z.literal("error"),
	responseCode: z.string().optional(),
	code: z.string(),
	message: z.string(),
});
export type CallbackSseErrorEvent = z.infer<typeof callbackSseErrorEventSchema>;

export const callbackSseEventNameSchema = z.enum([
	"connected",
	"pending",
	"completed",
	"failed",
	"error",
]);
export type CallbackSseEventName = z.infer<typeof callbackSseEventNameSchema>;

export const callbackSseEventNames: CallbackSseEventName[] = [
	"connected",
	"pending",
	"completed",
	"failed",
	"error",
];

export const callbackSseEventSchema = z.discriminatedUnion("eventType", [
	callbackSseConnectedEventSchema,
	callbackSsePendingEventSchema,
	callbackSseCompletedEventSchema,
	callbackSseFailedEventSchema,
	callbackSseErrorEventSchema,
]);
export type CallbackSseEvent = z.infer<typeof callbackSseEventSchema>;
