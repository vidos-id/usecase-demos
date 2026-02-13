import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
paymentCompleteRequestSchema,
paymentCompleteResponseSchema,
paymentRequestResponseSchema,
paymentRequestSchema,
paymentStatusResponseSchema,
} from "shared/api/payment";
import {
completePayment,
createPaymentRequest,
getPaymentStatus,
} from "../services/payment-service";

function getSessionId(authHeader?: string) {
if (!authHeader?.startsWith("Bearer ")) return undefined;
return authHeader.slice(7);
}

export const paymentRouter = new Hono()
.post("/request", zValidator("json", paymentRequestSchema), async (c) => {
const sessionId = getSessionId(c.req.header("Authorization"));
if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
const result = await createPaymentRequest(sessionId, c.req.valid("json"));
if (result.kind !== "created") return c.json({ error: "Unauthorized" }, 401);
const response = paymentRequestResponseSchema.parse(
result.result.mode === "direct_post"
? {
mode: "direct_post",
requestId: result.request.id,
transactionId: result.transactionId,
authorizeUrl: result.result.authorizeUrl,
requestedClaims: ["family_name", "given_name", "personal_administrative_number"],
purpose: "Approve this payment",
}
: {
mode: "dc_api",
requestId: result.request.id,
transactionId: result.transactionId,
dcApiRequest: result.result.dcApiRequest,
requestedClaims: ["family_name", "given_name", "personal_administrative_number"],
purpose: "Approve this payment",
},
);
return c.json(response);
})
.get("/status/:requestId", async (c) => {
const sessionId = getSessionId(c.req.header("Authorization"));
if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
const result = await getPaymentStatus(sessionId, c.req.param("requestId"));
		if (result.kind === "not_found") return c.json({ error: "Request not found" }, 404);
		if (result.kind === "unauthorized") return c.json({ error: "Unauthorized" }, 401);
		if (result.kind === "identity_mismatch") return c.json({ error: "Identity mismatch" }, 403);
		if (result.kind === "invalid_request") return c.json({ error: "Request is invalid" }, 400);
		if (result.kind === "authorized") {
return c.json(
paymentStatusResponseSchema.parse({
status: "authorized",
transactionId: result.transactionId,
claims: result.identity,
}),
);
}
		return c.json(paymentStatusResponseSchema.parse({ status: result.status }));
})
.post(
"/complete/:requestId",
zValidator("json", paymentCompleteRequestSchema),
async (c) => {
const sessionId = getSessionId(c.req.header("Authorization"));
if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
const { origin, dcResponse } = c.req.valid("json");
const result = await completePayment(
sessionId,
c.req.param("requestId"),
origin,
dcResponse,
);
if (result.kind === "not_found") {
return c.json({ error: "Request not found or expired" }, 404);
}
if (result.kind === "unauthorized") return c.json({ error: "Unauthorized" }, 401);
if (result.kind === "identity_mismatch") return c.json({ error: "Identity mismatch" }, 403);
if (result.kind !== "authorized") {
return c.json({ error: "Verification failed" }, 400);
}

const confirmedAt = new Date().toISOString();
return c.json(
paymentCompleteResponseSchema.parse({
transactionId: result.transactionId,
confirmedAt,
recipient: result.recipient,
amount: result.amount,
reference: result.reference,
verifiedIdentity: result.identity,
transaction: {
id: result.transactionId,
recipient: result.recipient,
amount: result.amount,
reference: result.reference,
confirmedAt,
},
}),
);
},
);
