import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
signinCompleteRequestSchema,
signinCompleteResponseSchema,
signinRequestResponseSchema,
signinRequestSchema,
signinStatusResponseSchema,
} from "shared/api/signin";
import {
deleteSessionResponseSchema,
sessionResponseSchema,
} from "shared/api/session";
import {
signupCompleteRequestSchema,
signupCompleteResponseSchema,
signupRequestResponseSchema,
signupRequestSchema,
signupStatusResponseSchema,
} from "shared/api/signup";
import {
completeSignin,
completeSignup,
createSigninRequest,
createSignupRequest,
getSigninStatus,
getSignupStatus,
} from "../services/auth-service";
import { sessionsRepository } from "../repositories/sessions-repository";

function getSessionIdFromHeader(authHeader?: string) {
if (!authHeader?.startsWith("Bearer ")) return undefined;
return authHeader.slice(7);
}

export const authRouter = new Hono()
.post("/signup/request", zValidator("json", signupRequestSchema), async (c) => {
const { mode } = c.req.valid("json");
const { request, result } = await createSignupRequest(mode);
const response = signupRequestResponseSchema.parse(
result.mode === "direct_post"
? {
mode: "direct_post",
requestId: request.id,
authorizationId: result.authorizationId,
authorizeUrl: result.authorizeUrl,
requestedClaims: ["family_name", "given_name", "personal_administrative_number"],
purpose: "Create your account",
}
: {
mode: "dc_api",
requestId: request.id,
authorizationId: result.authorizationId,
dcApiRequest: result.dcApiRequest,
responseUrl: result.responseUrl,
requestedClaims: ["family_name", "given_name", "personal_administrative_number"],
purpose: "Create your account",
},
);
return c.json(response);
})
.get("/signup/status/:requestId", async (c) => {
const result = await getSignupStatus(c.req.param("requestId"));
if (result.kind === "not_found") return c.json({ error: "Request not found" }, 404);
if (result.kind === "account_exists") {
return c.json(signupStatusResponseSchema.parse({ status: "account_exists" }));
}
if (result.kind === "authorized") {
return c.json(
signupStatusResponseSchema.parse({
status: "authorized",
sessionId: result.session.id,
user: {
id: result.user.id,
familyName: result.user.familyName,
givenName: result.user.givenName,
},
mode: result.mode,
}),
);
}
return c.json(signupStatusResponseSchema.parse({ status: result.status }));
})
.post(
"/signup/complete/:requestId",
zValidator("json", signupCompleteRequestSchema),
async (c) => {
const { origin, dcResponse } = c.req.valid("json");
const result = await completeSignup(c.req.param("requestId"), origin, dcResponse);
if (result.kind === "not_found") {
return c.json({ error: "Request not found or expired" }, 404);
}
if (result.kind === "account_exists") {
return c.json({ error: "Account already exists" }, 400);
}
if (result.kind !== "authorized") {
return c.json({ error: "Verification failed" }, 400);
}
return c.json(
signupCompleteResponseSchema.parse({
sessionId: result.session.id,
user: {
id: result.user.id,
familyName: result.user.familyName,
givenName: result.user.givenName,
},
mode: result.mode,
}),
);
},
)
.post("/signin/request", zValidator("json", signinRequestSchema), async (c) => {
const { mode } = c.req.valid("json");
const { request, result } = await createSigninRequest(mode);
const response = signinRequestResponseSchema.parse(
result.mode === "direct_post"
? {
mode: "direct_post",
requestId: request.id,
authorizeUrl: result.authorizeUrl,
requestedClaims: ["personal_administrative_number"],
purpose: "Sign in to your account",
}
: {
mode: "dc_api",
requestId: request.id,
dcApiRequest: result.dcApiRequest,
requestedClaims: ["personal_administrative_number"],
purpose: "Sign in to your account",
},
);
return c.json(response);
})
.get("/signin/status/:requestId", async (c) => {
const result = await getSigninStatus(c.req.param("requestId"));
if (result.kind === "not_found") return c.json({ error: "Request not found" }, 404);
if (result.kind === "user_not_found") {
return c.json(
signinStatusResponseSchema.parse({
status: "not_found",
error: "No account found with this credential.",
}),
);
}
if (result.kind === "authorized") {
return c.json(
signinStatusResponseSchema.parse({
status: "authorized",
sessionId: result.session.id,
user: {
id: result.user.id,
familyName: result.user.familyName,
givenName: result.user.givenName,
},
mode: result.mode,
}),
);
}
return c.json(signinStatusResponseSchema.parse({ status: result.status }));
})
.post(
"/signin/complete/:requestId",
zValidator("json", signinCompleteRequestSchema),
async (c) => {
const { origin, dcResponse } = c.req.valid("json");
const result = await completeSignin(c.req.param("requestId"), origin, dcResponse);
if (result.kind === "not_found") {
return c.json({ error: "Request not found or expired" }, 404);
}
if (result.kind === "user_not_found") {
return c.json({ error: "No account found with this credential." }, 404);
}
if (result.kind !== "authorized") {
return c.json({ error: "Verification failed" }, 400);
}
return c.json(
signinCompleteResponseSchema.parse({
sessionId: result.session.id,
user: {
id: result.user.id,
familyName: result.user.familyName,
givenName: result.user.givenName,
},
mode: result.mode,
}),
);
},
)
.get("/session", (c) => {
const sessionId = getSessionIdFromHeader(c.req.header("Authorization"));
if (!sessionId) {
return c.json(sessionResponseSchema.parse({ authenticated: false }));
}
const session = sessionsRepository.findActiveById(sessionId);
if (!session) {
return c.json(sessionResponseSchema.parse({ authenticated: false }));
}
return c.json(
sessionResponseSchema.parse({
authenticated: true,
userId: session.userId,
mode: session.mode,
}),
);
})
.delete("/session", (c) => {
const sessionId = getSessionIdFromHeader(c.req.header("Authorization"));
if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
sessionsRepository.revokeById(sessionId);
return c.json(deleteSessionResponseSchema.parse({ success: true }));
});
