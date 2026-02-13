import { LOAN_CLAIMS, LOAN_PURPOSE } from "shared/lib/claims";
import { loanClaimsSchema } from "shared/types/auth";
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

export interface LoanPayload {
amount: string;
purpose: string;
term: string;
}

function getRequestPayload(raw: string | null): LoanPayload | undefined {
if (!raw) return undefined;
const parsed = JSON.parse(raw) as Record<string, unknown>;
if (
typeof parsed.amount !== "string" ||
typeof parsed.purpose !== "string" ||
typeof parsed.term !== "string"
) {
return undefined;
}
return {
amount: parsed.amount,
purpose: parsed.purpose,
term: parsed.term,
};
}

async function finalizeLoan(requestId: string, sessionId: string) {
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
loanClaimsSchema,
);
if (claims.personal_administrative_number !== user.identifier) {
return { kind: "identity_mismatch" as const };
}

activitiesRepository.create({
userId: user.id,
kind: "loan",
title: "Loan application submitted",
amount: Number(payload.amount),
metadata: {
loanAmount: Number(payload.amount),
loanPurpose: payload.purpose,
loanTerm: Number(payload.term),
},
});
const loanRequestId = `loan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
authRequestsRepository.updateStatus(request.id, "authorized", {
verifiedClaims: {
loanRequestId,
familyName: claims.family_name,
givenName: claims.given_name,
identifier: claims.personal_administrative_number,
},
});
return {
kind: "authorized" as const,
loanRequestId,
claims: {
familyName: claims.family_name,
givenName: claims.given_name,
identifier: claims.personal_administrative_number,
},
};
}

export async function createLoanRequest(sessionId: string, payload: LoanPayload) {
const session = sessionsRepository.findActiveById(sessionId);
if (!session) return { kind: "unauthorized" as const };
const result = await createAuthorizationRequest({
mode: session.mode,
requestedClaims: LOAN_CLAIMS,
purpose: LOAN_PURPOSE,
});
	const request = authRequestsRepository.create({
		externalAuthorizationId: result.authorizationId,
		kind: "loan",
		mode: session.mode,
		requestPayload: { ...payload },
	});
return { kind: "created" as const, request, result };
}

export async function getLoanStatus(sessionId: string, requestId: string) {
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
loanRequestId:
typeof claims.loanRequestId === "string" ? claims.loanRequestId : "",
claims: {
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
return finalizeLoan(requestId, sessionId);
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

export async function completeLoan(
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
return finalizeLoan(requestId, sessionId);
}
