import { z } from "zod";
import {
	authorizationFlowTypeSchema,
	authorizationStreamEventSchema,
} from "./authorization-sse";
import { callbackSseEventSchema } from "./callback-sse";

export const debugEventTypeSchema = z.enum([
	"request_lifecycle",
	"upstream_call",
	"validation_error",
	"state_transition",
	"system",
]);
export type DebugEventType = z.infer<typeof debugEventTypeSchema>;

export const debugLevelSchema = z.enum(["info", "warn", "error", "debug"]);
export type DebugLevel = z.infer<typeof debugLevelSchema>;

export const debugSseEnvelopeSchema = z.object({
	eventType: debugEventTypeSchema,
	level: debugLevelSchema,
	timestamp: z.iso.datetime(),
	message: z.string(),
	requestId: z.string().optional(),
	flowType: authorizationFlowTypeSchema.optional(),
});
export type DebugSseEnvelope = z.infer<typeof debugSseEnvelopeSchema>;

export const requestLifecycleDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("request_lifecycle"),
	stage: z
		.enum([
			"request_created",
			"request_resolved",
			"monitor_started",
			"monitor_stopped",
			"stream_connected",
			"stream_closed",
		])
		.optional(),
	details: z.record(z.string(), z.unknown()).optional(),
});
export type RequestLifecycleDebugEvent = z.infer<
	typeof requestLifecycleDebugEventSchema
>;

export const upstreamCallDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("upstream_call"),
	operation: z.string(),
	status: z.string().optional(),
	durationMs: z.number().int().nonnegative().optional(),
	details: z.record(z.string(), z.unknown()).optional(),
});
export type UpstreamCallDebugEvent = z.infer<
	typeof upstreamCallDebugEventSchema
>;

export const validationErrorDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("validation_error"),
	code: z.string().optional(),
	field: z.string().optional(),
	details: z.record(z.string(), z.unknown()).optional(),
});
export type ValidationErrorDebugEvent = z.infer<
	typeof validationErrorDebugEventSchema
>;

export const stateTransitionDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("state_transition"),
	from: z.string(),
	to: z.string(),
	details: z.record(z.string(), z.unknown()).optional(),
});
export type StateTransitionDebugEvent = z.infer<
	typeof stateTransitionDebugEventSchema
>;

export const systemDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("system"),
	code: z.string().optional(),
	details: z.record(z.string(), z.unknown()).optional(),
});
export type SystemDebugEvent = z.infer<typeof systemDebugEventSchema>;

export const debugSseEventNameSchema = debugEventTypeSchema;
export type DebugSseEventName = z.infer<typeof debugSseEventNameSchema>;

export const debugSseEventNames: DebugSseEventName[] = [
	"request_lifecycle",
	"upstream_call",
	"validation_error",
	"state_transition",
	"system",
];

export const debugSseEventSchema = z.discriminatedUnion("eventType", [
	requestLifecycleDebugEventSchema,
	upstreamCallDebugEventSchema,
	validationErrorDebugEventSchema,
	stateTransitionDebugEventSchema,
	systemDebugEventSchema,
]);
export type DebugSseEvent = z.infer<typeof debugSseEventSchema>;

export const parseDebugSseEvent = (value: unknown): DebugSseEvent => {
	return debugSseEventSchema.parse(value);
};

export const safeParseDebugSseEvent = (value: unknown) => {
	return debugSseEventSchema.safeParse(value);
};

export const sseChannelNameSchema = z.enum([
	"authorization",
	"callback",
	"debug",
]);
export type SseChannelName = z.infer<typeof sseChannelNameSchema>;

export const debugSseChannelSchema = z.literal("debug");
export type DebugSseChannel = z.infer<typeof debugSseChannelSchema>;

export const businessSseChannelSchema = z.enum(["authorization", "callback"]);
export type BusinessSseChannel = z.infer<typeof businessSseChannelSchema>;

export const authorizationChannelEventSchema = z.object({
	channel: z.literal("authorization"),
	event: authorizationStreamEventSchema,
});
export type AuthorizationChannelEvent = z.infer<
	typeof authorizationChannelEventSchema
>;

export const callbackChannelEventSchema = z.object({
	channel: z.literal("callback"),
	event: callbackSseEventSchema,
});
export type CallbackChannelEvent = z.infer<typeof callbackChannelEventSchema>;

export const debugChannelEventSchema = z.object({
	channel: z.literal("debug"),
	event: debugSseEventSchema,
});
export type DebugChannelEvent = z.infer<typeof debugChannelEventSchema>;

export const businessChannelEventSchema = z.discriminatedUnion("channel", [
	authorizationChannelEventSchema,
	callbackChannelEventSchema,
]);
export type BusinessChannelEvent = z.infer<typeof businessChannelEventSchema>;

export const sseChannelEventSchema = z.discriminatedUnion("channel", [
	authorizationChannelEventSchema,
	callbackChannelEventSchema,
	debugChannelEventSchema,
]);
export type SseChannelEvent = z.infer<typeof sseChannelEventSchema>;

export const parseDebugChannelEvent = (value: unknown): DebugChannelEvent => {
	return debugChannelEventSchema.parse(value);
};
