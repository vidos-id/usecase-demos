import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
loanCompleteRequestSchema,
loanCompleteResponseSchema,
loanRequestResponseSchema,
loanRequestSchema,
loanStatusResponseSchema,
} from "shared/api/loan";
import { completeLoan, createLoanRequest, getLoanStatus } from "../services/loan-service";

function getSessionId(authHeader?: string) {
if (!authHeader?.startsWith("Bearer ")) return undefined;
return authHeader.slice(7);
}

export const loanRouter = new Hono()
.post("/request", zValidator("json", loanRequestSchema), async (c) => {
const sessionId = getSessionId(c.req.header("Authorization"));
if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
const result = await createLoanRequest(sessionId, c.req.valid("json"));
if (result.kind !== "created") return c.json({ error: "Unauthorized" }, 401);
const response = loanRequestResponseSchema.parse(
result.result.mode === "direct_post"
? {
mode: "direct_post",
requestId: result.request.id,
authorizeUrl: result.result.authorizeUrl,
requestedClaims: ["family_name", "given_name", "personal_administrative_number"],
purpose: "Approve this loan application",
}
: {
mode: "dc_api",
requestId: result.request.id,
dcApiRequest: result.result.dcApiRequest,
requestedClaims: ["family_name", "given_name", "personal_administrative_number"],
purpose: "Approve this loan application",
},
);
return c.json(response);
})
.get("/status/:requestId", async (c) => {
const sessionId = getSessionId(c.req.header("Authorization"));
if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
const result = await getLoanStatus(sessionId, c.req.param("requestId"));
		if (result.kind === "not_found") return c.json({ error: "Request not found" }, 404);
		if (result.kind === "unauthorized") return c.json({ error: "Unauthorized" }, 401);
		if (result.kind === "identity_mismatch") return c.json({ error: "Identity mismatch" }, 403);
		if (result.kind === "invalid_request") return c.json({ error: "Request is invalid" }, 400);
		if (result.kind === "authorized") {
return c.json(
loanStatusResponseSchema.parse({
status: "authorized",
loanRequestId: result.loanRequestId,
claims: result.claims,
}),
);
}
		return c.json(loanStatusResponseSchema.parse({ status: result.status }));
	})
.post("/complete/:requestId", zValidator("json", loanCompleteRequestSchema), async (c) => {
const sessionId = getSessionId(c.req.header("Authorization"));
if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
const { origin, dcResponse } = c.req.valid("json");
const result = await completeLoan(
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
return c.json(
loanCompleteResponseSchema.parse({
loanRequestId: result.loanRequestId,
message: "We'll review your application and contact you within 2 business days.",
}),
);
});
