import {
SIGNIN_CLAIMS,
SIGNIN_PURPOSE,
SIGNUP_CLAIMS,
SIGNUP_PURPOSE,
} from "shared/lib/claims";
import { signinClaimsSchema, signupClaimsSchema } from "shared/types/auth";
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

const SEED_TRANSACTIONS = [
{ title: "Salary Deposit", amount: 3500.0 },
{ title: "Supermart Groceries", amount: -87.45 },
{ title: "Coffee Corner", amount: -4.8 },
{ title: "Electric Bill", amount: -124.0 },
{ title: "Streaming Service", amount: -12.99 },
{ title: "Public Transit", amount: -45.0 },
{ title: "Restaurant Dinner", amount: -62.3 },
{ title: "Pharmacy", amount: -23.5 },
{ title: "Bonus Payment", amount: 500.0 },
{ title: "Gas Station", amount: -55.0 },
] as const;

function seedUserActivity(userId: string) {
	const count = Math.floor(Math.random() * 4) + 3;
	const shuffled = [...SEED_TRANSACTIONS].sort(() => Math.random() - 0.5);
	const now = Date.now();
	const dayMs = 24 * 60 * 60 * 1000;
	for (const [index, transaction] of shuffled.slice(0, count).entries()) {
		activitiesRepository.create({
			userId,
			kind: "payment",
			title: transaction.title,
			amount: transaction.amount,
			metadata: {
				reference: "seed",
			},
			createdAt: new Date(now - (index + 1) * dayMs).toISOString(),
		});
	}
}

function normalizeAddress(placeOfBirth?: { locality?: string; country?: string }) {
if (!placeOfBirth) return undefined;
const value = [placeOfBirth.locality, placeOfBirth.country]
.filter(Boolean)
.join(", ");
return value || undefined;
}

export async function createSignupRequest(mode: "direct_post" | "dc_api") {
const result = await createAuthorizationRequest({
mode,
requestedClaims: SIGNUP_CLAIMS,
purpose: SIGNUP_PURPOSE,
});
const request = authRequestsRepository.create({
externalAuthorizationId: result.authorizationId,
kind: "signup",
mode,
});
return { request, result };
}

export async function getSignupStatus(requestId: string) {
const request = authRequestsRepository.findById(requestId);
if (!request) return { kind: "not_found" as const };
const statusResult = await pollAuthorizationStatus(request.externalAuthorizationId);
if (statusResult.status !== "authorized") {
if (statusResult.status === "expired") {
authRequestsRepository.updateStatus(request.id, "expired");
}
if (statusResult.status === "error" || statusResult.status === "rejected") {
authRequestsRepository.updateStatus(request.id, "failed");
}
return { kind: "status" as const, status: statusResult.status };
}

const claims = await getExtractedCredentials(
request.externalAuthorizationId,
signupClaimsSchema,
);
const existingUser = usersRepository.findByIdentifier(
claims.personal_administrative_number,
);
if (existingUser) {
authRequestsRepository.deleteById(request.id);
return { kind: "account_exists" as const };
}

const user = usersRepository.create({
identifier: claims.personal_administrative_number,
documentNumber: claims.document_number,
familyName: claims.family_name,
givenName: claims.given_name,
birthDate: claims.birthdate,
nationality: claims.nationalities?.join(", "),
email: claims.email,
address: normalizeAddress(claims.place_of_birth),
portrait: claims.picture,
});
seedUserActivity(user.id);
const session = sessionsRepository.create(user.id, request.mode);
authRequestsRepository.deleteById(request.id);
return { kind: "authorized" as const, user, session, mode: request.mode };
}

export async function completeSignup(
requestId: string,
origin: string,
dcResponse: Record<string, unknown>,
) {
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

const status = await getSignupStatus(requestId);
if (status.kind === "authorized") return status;
if (status.kind === "account_exists") return status;
return { kind: "failed" as const };
}

export async function createSigninRequest(mode: "direct_post" | "dc_api") {
const result = await createAuthorizationRequest({
mode,
requestedClaims: SIGNIN_CLAIMS,
purpose: SIGNIN_PURPOSE,
});
const request = authRequestsRepository.create({
externalAuthorizationId: result.authorizationId,
kind: "signin",
mode,
});
return { request, result };
}

export async function getSigninStatus(requestId: string) {
const request = authRequestsRepository.findById(requestId);
if (!request) return { kind: "not_found" as const };
const statusResult = await pollAuthorizationStatus(request.externalAuthorizationId);
if (statusResult.status !== "authorized") {
if (statusResult.status === "expired") {
authRequestsRepository.updateStatus(request.id, "expired");
}
if (statusResult.status === "error" || statusResult.status === "rejected") {
authRequestsRepository.updateStatus(request.id, "failed");
}
return { kind: "status" as const, status: statusResult.status };
}

const claims = await getExtractedCredentials(
request.externalAuthorizationId,
signinClaimsSchema,
);
const user = usersRepository.findByIdentifier(claims.personal_administrative_number);
if (!user) {
authRequestsRepository.deleteById(request.id);
return { kind: "user_not_found" as const };
}

const session = sessionsRepository.create(user.id, request.mode);
authRequestsRepository.deleteById(request.id);
return { kind: "authorized" as const, user, session, mode: request.mode };
}

export async function completeSignin(
requestId: string,
origin: string,
dcResponse: Record<string, unknown>,
) {
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
const status = await getSigninStatus(requestId);
if (status.kind === "authorized") return status;
if (status.kind === "user_not_found") return status;
return { kind: "failed" as const };
}
