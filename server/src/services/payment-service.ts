import { PAYMENT_CLAIMS, PAYMENT_PURPOSE } from "shared/lib/claims";
import { paymentClaimsSchema } from "shared/types/auth";
import {
createAuthorizationRequest,
forwardDCAPIResponse,
getExtractedCredentials,
pollAuthorizationStatus,
} from "./vidos";
import { activitiesRepository } from "../repositories/activities-repository";
import { authRequestsRepository } from "../repositories/auth-requests-repository";
import { sessionsRepository } from "../repositories/sessions-repository";
import { usersRepository } from "../repositories/users-repository";

export interface PaymentPayload {
recipient: string;
amount: string;
reference?: string;
}

function getRequestPayload(
raw: string | null,
): (PaymentPayload & { transactionId: string }) | undefined {
if (!raw) return undefined;
const parsed = JSON.parse(raw) as Record<string, unknown>;
if (
typeof parsed.transactionId !== "string" ||
typeof parsed.recipient !== "string" ||
typeof parsed.amount !== "string"
) {
return undefined;
}
return {
transactionId: parsed.transactionId,
recipient: parsed.recipient,
amount: parsed.amount,
reference: typeof parsed.reference === "string" ? parsed.reference : undefined,
};
}

async function finalizePayment(requestId: string, sessionId: string) {
const session = sessionsRepository.findActiveById(sessionId);
if (!session) return { kind: "unauthorized" as const };
const request = authRequestsRepository.findById(requestId);
if (!request) return { kind: "not_found" as const };
const payload = getRequestPayload(request.requestPayload);
if (!payload) return { kind: "invalid_request" as const };
const user = usersRepository.findById(session.userId);
if (!user) return { kind: "unauthorized" as const };

const claims = await getExtractedCredentials(
request.externalAuthorizationId,
paymentClaimsSchema,
);

if (claims.personal_administrative_number !== user.identifier) {
return { kind: "identity_mismatch" as const };
}

activitiesRepository.create({
userId: user.id,
kind: "payment",
title: `Payment to ${payload.recipient}`,
amount: -Number(payload.amount),
metadata: {
recipient: payload.recipient,
reference: payload.reference,
},
});
authRequestsRepository.updateStatus(request.id, "authorized", {
verifiedClaims: {
transactionId: payload.transactionId,
familyName: claims.family_name,
givenName: claims.given_name,
identifier: claims.personal_administrative_number,
},
});
return {
kind: "authorized" as const,
transactionId: payload.transactionId,
recipient: payload.recipient,
amount: payload.amount,
reference: payload.reference,
identity: {
familyName: claims.family_name,
givenName: claims.given_name,
identifier: claims.personal_administrative_number,
},
};
}

export async function createPaymentRequest(sessionId: string, payload: PaymentPayload) {
const session = sessionsRepository.findActiveById(sessionId);
if (!session) return { kind: "unauthorized" as const };
const transactionId = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const result = await createAuthorizationRequest({
mode: session.mode,
requestedClaims: PAYMENT_CLAIMS,
purpose: PAYMENT_PURPOSE,
});
const request = authRequestsRepository.create({
externalAuthorizationId: result.authorizationId,
kind: "payment",
mode: session.mode,
requestPayload: { ...payload, transactionId },
});
return { kind: "created" as const, request, result, transactionId };
}

export async function getPaymentStatus(sessionId: string, requestId: string) {
const session = sessionsRepository.findActiveById(sessionId);
if (!session) return { kind: "unauthorized" as const };
const request = authRequestsRepository.findById(requestId);
if (!request) return { kind: "not_found" as const };
if (request.status === "authorized") {
const claims = request.verifiedClaims
? (JSON.parse(request.verifiedClaims) as Record<string, unknown>)
: {};
return {
kind: "authorized" as const,
transactionId:
typeof claims.transactionId === "string" ? claims.transactionId : "",
identity: {
familyName:
typeof claims.familyName === "string" ? claims.familyName : "",
givenName:
typeof claims.givenName === "string" ? claims.givenName : "",
identifier:
typeof claims.identifier === "string" ? claims.identifier : "",
},
};
}
const status = await pollAuthorizationStatus(request.externalAuthorizationId);
if (status.status === "authorized") {
return finalizePayment(requestId, sessionId);
}
if (status.status === "expired") {
authRequestsRepository.updateStatus(request.id, "expired");
}
if (status.status === "error" || status.status === "rejected") {
authRequestsRepository.updateStatus(request.id, "failed", {
errorMessage: `Verification ${status.status}`,
});
}
return { kind: "status" as const, status: status.status };
}

export async function completePayment(
sessionId: string,
requestId: string,
origin: string,
dcResponse: Record<string, unknown>,
) {
const session = sessionsRepository.findActiveById(sessionId);
if (!session) return { kind: "unauthorized" as const };
const request = authRequestsRepository.findById(requestId);
if (!request) return { kind: "not_found" as const };
const result = await forwardDCAPIResponse({
authorizationId: request.externalAuthorizationId,
origin,
dcResponse: dcResponse as
| { response: string }
| { vp_token: Record<string, unknown> },
});
if (result.status !== "authorized") {
return { kind: "failed" as const };
}
return finalizePayment(requestId, sessionId);
}
