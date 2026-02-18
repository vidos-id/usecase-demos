import { z } from "zod";
import {
	authorizationFlowTypeSchema,
	authorizationStreamEventSchema,
} from "./authorization-sse";
import { callbackSseEventSchema } from "./callback-sse";

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export const debugEventTypeSchema = z.enum([
	// Vidos Authorizer protocol events (primary focus)
	"vidos_request", // outbound request to Vidos (with full payload)
	"vidos_response", // response received from Vidos (with full payload + duration)
	"dc_api_forwarded", // credential from browser forwarded to Vidos
	"credential_result", // Vidos reported extracted credential claims
	"policy_result", // Vidos reported policy evaluation result
	// Internal app events (secondary, lower noise)
	"error", // notable server-side error worth surfacing
]);
export type DebugEventType = z.infer<typeof debugEventTypeSchema>;

export const debugLevelSchema = z.enum(["info", "warn", "error", "debug"]);
export type DebugLevel = z.infer<typeof debugLevelSchema>;

// ---------------------------------------------------------------------------
// Display metadata registry (labels + descriptions shown in the UI)
// ---------------------------------------------------------------------------

export type DebugEventMeta = {
	label: string;
	description: string;
};

export const DEBUG_EVENT_META: Record<DebugEventType, DebugEventMeta> = {
	vidos_request: {
		label: "Vidos Request",
		description:
			"An outbound HTTP request sent from the server to the Vidos Authorizer API. Shows the full request payload including DCQL query, response mode, and any credential parameters.",
	},
	vidos_response: {
		label: "Vidos Response",
		description:
			"The HTTP response received back from the Vidos Authorizer API. Shows status, body payload, and round-trip duration.",
	},
	dc_api_forwarded: {
		label: "DC API Forwarded",
		description:
			"The browser Digital Credentials API response received from the client was forwarded to the Vidos Authorizer for verification. Shows the origin and response format.",
	},
	credential_result: {
		label: "Credential Result",
		description:
			"Vidos reported the extracted and verified credential claims after a successful authorization. For direct_post this fires after polling detects authorized status; for dc_api it fires directly.",
	},
	policy_result: {
		label: "Policy Result",
		description:
			"Vidos reported the policy evaluation outcome. Contains policy check results, errors, or rejection reasons. Fired separately from credential data.",
	},
	error: {
		label: "Error",
		description:
			"A notable server-side error occurred during the authorization flow — such as a monitor failure, identity mismatch, or unexpected state.",
	},
};

// ---------------------------------------------------------------------------
// Vidos operation names
// ---------------------------------------------------------------------------

export const vidosOperationSchema = z.enum([
	"createAuthorization",
	"pollStatus",
	"forwardDCAPI",
	"resolveResponseCode",
	"getCredentials",
	"getPolicyErrors",
]);
export type VidosOperation = z.infer<typeof vidosOperationSchema>;

// ---------------------------------------------------------------------------
// Common envelope
// ---------------------------------------------------------------------------

export const debugSseEnvelopeSchema = z.object({
	eventType: debugEventTypeSchema,
	level: debugLevelSchema,
	timestamp: z.iso.datetime(),
	message: z.string(),
	requestId: z.string().optional(),
	flowType: authorizationFlowTypeSchema.optional(),
});
export type DebugSseEnvelope = z.infer<typeof debugSseEnvelopeSchema>;

// ---------------------------------------------------------------------------
// Typed event schemas
// ---------------------------------------------------------------------------

/** Outbound request to Vidos Authorizer */
export const vidosRequestDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("vidos_request"),
	operation: vidosOperationSchema,
	method: z.string(), // HTTP method
	url: z.string(), // endpoint path
	payload: z.record(z.string(), z.unknown()).optional(), // request body / params
});
export type VidosRequestDebugEvent = z.infer<
	typeof vidosRequestDebugEventSchema
>;

/** Response received from Vidos Authorizer */
export const vidosResponseDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("vidos_response"),
	operation: vidosOperationSchema,
	httpStatus: z.number().int(),
	durationMs: z.number().int().nonnegative(),
	ok: z.boolean(),
	payload: z.record(z.string(), z.unknown()).optional(), // response body
	errorMessage: z.string().optional(),
});
export type VidosResponseDebugEvent = z.infer<
	typeof vidosResponseDebugEventSchema
>;

/** Browser DC API credential forwarded to Vidos */
export const dcApiForwardedDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("dc_api_forwarded"),
	authorizationId: z.string(),
	origin: z.string(),
	responseFormat: z.enum(["jwt", "vp_token"]),
});
export type DcApiForwardedDebugEvent = z.infer<
	typeof dcApiForwardedDebugEventSchema
>;

/** Extracted credential claims from a successful authorization */
export const credentialResultDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("credential_result"),
	authorizationId: z.string(),
	source: z.enum(["direct_post_poll", "dc_api"]),
	httpStatus: z.number().int().optional(),
	durationMs: z.number().int().nonnegative().optional(),
	claims: z.record(z.string(), z.unknown()),
});
export type CredentialResultDebugEvent = z.infer<
	typeof credentialResultDebugEventSchema
>;

/** Policy evaluation result from Vidos */
export const policyResultDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("policy_result"),
	authorizationId: z.string(),
	source: z.enum(["direct_post_poll", "dc_api"]),
	outcome: z.enum(["authorized", "rejected", "error", "expired"]),
	policies: z.array(z.record(z.string(), z.unknown())).optional(),
	errorInfo: z.record(z.string(), z.unknown()).optional(),
});
export type PolicyResultDebugEvent = z.infer<
	typeof policyResultDebugEventSchema
>;

/** Notable server-side error */
export const errorDebugEventSchema = debugSseEnvelopeSchema.extend({
	eventType: z.literal("error"),
	code: z.string().optional(),
	details: z.record(z.string(), z.unknown()).optional(),
});
export type ErrorDebugEvent = z.infer<typeof errorDebugEventSchema>;

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export const debugSseEventSchema = z.discriminatedUnion("eventType", [
	vidosRequestDebugEventSchema,
	vidosResponseDebugEventSchema,
	dcApiForwardedDebugEventSchema,
	credentialResultDebugEventSchema,
	policyResultDebugEventSchema,
	errorDebugEventSchema,
]);
export type DebugSseEvent = z.infer<typeof debugSseEventSchema>;

export const debugSseEventNames: DebugEventType[] = [
	"vidos_request",
	"vidos_response",
	"dc_api_forwarded",
	"credential_result",
	"policy_result",
	"error",
];

export const parseDebugSseEvent = (value: unknown): DebugSseEvent => {
	return debugSseEventSchema.parse(value);
};

export const safeParseDebugSseEvent = (value: unknown) => {
	return debugSseEventSchema.safeParse(value);
};

// ---------------------------------------------------------------------------
// SSE channel types (unchanged)
// ---------------------------------------------------------------------------

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
