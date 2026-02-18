import { randomUUID } from "node:crypto";
import {
	loanClaimsSchema,
	paymentClaimsSchema,
	signinClaimsSchema,
	signupClaimsSchema,
} from "shared/types/auth";
import {
	loanAuthMetadataSchema,
	paymentAuthMetadataSchema,
	profileUpdateAuthMetadataSchema,
} from "shared/types/auth-metadata";
import { profileUpdateClaimsSchema } from "shared/types/profile-update";
import {
	authorizationErrorInfoSchema,
	vidosErrorTypes,
} from "shared/types/vidos-errors";
import { debugEmitters } from "../lib/debug-events";
import { buildProfileUpdate } from "../lib/profile-update";
import { getExtractedCredentials } from "../services/vidos";
import type { PendingAuthRequest } from "../stores/pending-auth-requests";
import {
	updateRequestToCompleted,
	updateRequestToFailed,
} from "../stores/pending-auth-requests";
import { createSession } from "../stores/sessions";
import {
	createUser,
	getUserById,
	getUserByIdentifier,
	updateUser,
} from "../stores/users";

const identityMismatchErrorInfo = authorizationErrorInfoSchema.parse({
	errorType: vidosErrorTypes.identityMismatch,
	title: "Identity Mismatch",
	detail:
		"The credential used for verification does not match your account identity.",
});

function createAccountSummary(user: {
	id: string;
	familyName: string;
	givenName: string;
}) {
	return {
		id: user.id,
		familyName: user.familyName,
		givenName: user.givenName,
	};
}

async function completeSignin(
	pendingRequest: PendingAuthRequest,
): Promise<void> {
	const claims = await getExtractedCredentials(
		pendingRequest.vidosAuthorizationId,
		signinClaimsSchema,
		{
			requestId: pendingRequest.id,
			flowType: pendingRequest.type,
		},
	);

	const user = getUserByIdentifier(claims.personal_administrative_number);
	if (!user) {
		debugEmitters.auth.transitionFailure(
			{ requestId: pendingRequest.id, flowType: pendingRequest.type },
			"Signin completed with unknown account.",
		);
		updateRequestToFailed(
			pendingRequest.id,
			"No account found with this credential.",
			undefined,
			{ status: "not_found" },
		);
		return;
	}

	const session = createSession({
		userId: user.id,
		mode: pendingRequest.mode,
	});

	updateRequestToCompleted(pendingRequest.id, claims, session.id, {
		status: "authorized",
		mode: pendingRequest.mode,
		user: createAccountSummary(user),
	});
}

async function completeSignup(
	pendingRequest: PendingAuthRequest,
): Promise<void> {
	const claims = await getExtractedCredentials(
		pendingRequest.vidosAuthorizationId,
		signupClaimsSchema,
		{
			requestId: pendingRequest.id,
			flowType: pendingRequest.type,
		},
	);

	const existingUser = getUserByIdentifier(
		claims.personal_administrative_number,
	);
	if (existingUser) {
		debugEmitters.auth.transitionFailure(
			{ requestId: pendingRequest.id, flowType: pendingRequest.type },
			"Signup attempted for existing account.",
		);
		updateRequestToFailed(
			pendingRequest.id,
			"Account already exists",
			undefined,
			{
				status: "account_exists",
			},
		);
		return;
	}

	const user = createUser({
		identifier: claims.personal_administrative_number,
		familyName: claims.family_name,
		givenName: claims.given_name,
		birthDate: claims.birthdate ?? "",
		nationality: claims.nationalities?.join(", ") ?? "",
		email: claims.email,
		address: claims.place_of_birth
			? [claims.place_of_birth.locality, claims.place_of_birth.country]
					.filter(Boolean)
					.join(", ")
			: undefined,
		portrait: claims.picture,
		documentNumber: claims.document_number,
	});

	const session = createSession({
		userId: user.id,
		mode: pendingRequest.mode,
	});

	updateRequestToCompleted(pendingRequest.id, claims, session.id, {
		status: "authorized",
		mode: pendingRequest.mode,
		user: createAccountSummary(user),
	});
}

async function completePayment(
	pendingRequest: PendingAuthRequest,
): Promise<void> {
	const metadata = pendingRequest.metadata;
	const parsed = paymentAuthMetadataSchema.safeParse(metadata);
	if (!parsed.success) {
		debugEmitters.auth.transitionFailure(
			{ requestId: pendingRequest.id, flowType: pendingRequest.type },
			"Payment completion metadata validation failed.",
			parsed.error.issues,
		);
		updateRequestToFailed(
			pendingRequest.id,
			"Invalid payment metadata for pending request.",
		);
		return;
	}

	const claims = await getExtractedCredentials(
		pendingRequest.vidosAuthorizationId,
		paymentClaimsSchema,
		{
			requestId: pendingRequest.id,
			flowType: pendingRequest.type,
		},
	);
	const user = getUserById(parsed.data.userId);

	if (!user || user.identifier !== claims.personal_administrative_number) {
		debugEmitters.auth.transitionFailure(
			{ requestId: pendingRequest.id, flowType: pendingRequest.type },
			"Payment completion identity mismatch.",
		);
		updateRequestToFailed(
			pendingRequest.id,
			identityMismatchErrorInfo.detail,
			identityMismatchErrorInfo,
			{ status: "rejected" },
		);
		return;
	}

	const paymentAmount = Number(parsed.data.amount);
	const activityItem = {
		id: randomUUID(),
		type: "payment" as const,
		title: `Payment to ${parsed.data.recipient}`,
		amount: -paymentAmount,
		createdAt: new Date().toISOString(),
		meta: {
			recipient: parsed.data.recipient,
			reference: parsed.data.reference,
		},
	};

	updateUser(user.id, {
		balance: user.balance - paymentAmount,
		activity: [activityItem, ...user.activity],
	});

	updateRequestToCompleted(pendingRequest.id, claims, undefined, {
		status: "authorized",
		transactionId: parsed.data.transactionId,
	});
}

async function completeLoan(pendingRequest: PendingAuthRequest): Promise<void> {
	const metadata = pendingRequest.metadata;
	const parsed = loanAuthMetadataSchema.safeParse(metadata);
	if (!parsed.success) {
		debugEmitters.auth.transitionFailure(
			{ requestId: pendingRequest.id, flowType: pendingRequest.type },
			"Loan completion metadata validation failed.",
			parsed.error.issues,
		);
		updateRequestToFailed(
			pendingRequest.id,
			"Invalid loan metadata for pending request.",
		);
		return;
	}

	const claims = await getExtractedCredentials(
		pendingRequest.vidosAuthorizationId,
		loanClaimsSchema,
		{
			requestId: pendingRequest.id,
			flowType: pendingRequest.type,
		},
	);
	const user = getUserById(parsed.data.userId);

	if (!user || user.identifier !== claims.personal_administrative_number) {
		debugEmitters.auth.transitionFailure(
			{ requestId: pendingRequest.id, flowType: pendingRequest.type },
			"Loan completion identity mismatch.",
		);
		updateRequestToFailed(
			pendingRequest.id,
			identityMismatchErrorInfo.detail,
			identityMismatchErrorInfo,
			{ status: "rejected" },
		);
		return;
	}

	const loanRequestId = `loan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
	const loanAmount = Number(parsed.data.amount);
	const activityItem = {
		id: randomUUID(),
		type: "loan" as const,
		title: "Loan application submitted",
		amount: loanAmount,
		createdAt: new Date().toISOString(),
		meta: {
			loanAmount,
			loanPurpose: parsed.data.purpose,
			loanTerm: Number(parsed.data.term),
		},
	};

	updateUser(user.id, {
		balance: user.balance + loanAmount,
		pendingLoansTotal: user.pendingLoansTotal + loanAmount,
		activity: [activityItem, ...user.activity],
	});

	updateRequestToCompleted(pendingRequest.id, claims, undefined, {
		status: "authorized",
		loanRequestId,
	});
}

async function completeProfileUpdate(
	pendingRequest: PendingAuthRequest,
): Promise<void> {
	const parsed = profileUpdateAuthMetadataSchema.safeParse(
		pendingRequest.metadata,
	);
	if (!parsed.success) {
		debugEmitters.auth.transitionFailure(
			{ requestId: pendingRequest.id, flowType: pendingRequest.type },
			"Profile update metadata validation failed.",
			parsed.error.issues,
		);
		updateRequestToFailed(
			pendingRequest.id,
			"Invalid profile update metadata for pending request.",
		);
		return;
	}

	const claims = await getExtractedCredentials(
		pendingRequest.vidosAuthorizationId,
		profileUpdateClaimsSchema,
		{
			requestId: pendingRequest.id,
			flowType: pendingRequest.type,
		},
	);
	const user = getUserById(parsed.data.userId);

	if (!user) {
		debugEmitters.auth.transitionFailure(
			{ requestId: pendingRequest.id, flowType: pendingRequest.type },
			"Profile update attempted with missing user.",
		);
		updateRequestToFailed(pendingRequest.id, "Unauthorized");
		return;
	}

	if (
		claims.personal_administrative_number &&
		claims.personal_administrative_number !== user.identifier
	) {
		debugEmitters.auth.transitionFailure(
			{ requestId: pendingRequest.id, flowType: pendingRequest.type },
			"Profile update identity mismatch.",
		);
		updateRequestToFailed(
			pendingRequest.id,
			identityMismatchErrorInfo.detail,
			identityMismatchErrorInfo,
			{ status: "rejected" },
		);
		return;
	}

	const { updates, updatedFields } = buildProfileUpdate(
		claims,
		parsed.data.requestedClaims,
	);
	updateUser(user.id, updates);
	updateRequestToCompleted(pendingRequest.id, claims, undefined, {
		status: "authorized",
		updatedFields,
	});
}

export async function completeAuthorizedPendingRequest(
	pendingRequest: PendingAuthRequest,
): Promise<void> {
	switch (pendingRequest.type) {
		case "signin":
			await completeSignin(pendingRequest);
			return;
		case "signup":
			await completeSignup(pendingRequest);
			return;
		case "payment":
			await completePayment(pendingRequest);
			return;
		case "loan":
			await completeLoan(pendingRequest);
			return;
		case "profile_update":
			await completeProfileUpdate(pendingRequest);
			return;
	}
}

export { identityMismatchErrorInfo };
