import { randomUUID } from "node:crypto";
import {
	loanAuthMetadataSchema,
	paymentAuthMetadataSchema,
	profileUpdateAuthMetadataSchema,
} from "shared/types/auth-metadata";
import {
	loanClaimsSchema,
	paymentClaimsSchema,
	signinClaimsSchema,
	signupClaimsSchema,
} from "shared/types/auth";
import { profileUpdateClaimsSchema } from "shared/types/profile-update";
import {
	authorizationErrorInfoSchema,
	vidosErrorTypes,
} from "shared/types/vidos-errors";
import { z } from "zod";
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
	type User,
	updateUser,
} from "../stores/users";

const profileUpdateAddressSchema = z.union([
	z.string(),
	z.object({
		formatted: z.string().optional(),
		street_address: z.string().optional(),
		locality: z.string().optional(),
		region: z.string().optional(),
		postal_code: z.string().optional(),
		country: z.string().optional(),
	}),
]);

const profileUpdateClaimsExtendedSchema = profileUpdateClaimsSchema.extend({
	birth_date: z.string().optional(),
	nationality: z.union([z.string(), z.array(z.string())]).optional(),
	email_address: z.string().optional(),
	portrait: z.string().optional(),
	address: profileUpdateAddressSchema.optional(),
	resident_address: z.string().optional(),
});

type ProfileUpdateClaims = z.infer<typeof profileUpdateClaimsExtendedSchema>;

function buildProfileUpdate(
	claims: ProfileUpdateClaims,
	requestedClaims: string[],
): { updates: Partial<User>; updatedFields: string[] } {
	const updates: Partial<User> = {};
	const updatedFields: string[] = [];

	const requested = new Set(requestedClaims);

	if (requested.has("family_name") && claims.family_name) {
		updates.familyName = claims.family_name;
		updatedFields.push("familyName");
	}

	if (requested.has("given_name") && claims.given_name) {
		updates.givenName = claims.given_name;
		updatedFields.push("givenName");
	}

	if (requested.has("birth_date")) {
		const birthDate = claims.birthdate ?? claims.birth_date;
		if (birthDate) {
			updates.birthDate = birthDate;
			updatedFields.push("birthDate");
		}
	}

	if (requested.has("nationality")) {
		const normalizedNationalities =
			claims.nationalities ??
			(Array.isArray(claims.nationality)
				? claims.nationality
				: claims.nationality
					? [claims.nationality]
					: undefined);
		const nationality = normalizedNationalities?.join(", ");
		if (nationality) {
			updates.nationality = nationality;
			updatedFields.push("nationality");
		}
	}

	if (requested.has("email_address")) {
		const email = claims.email ?? claims.email_address;
		if (email) {
			updates.email = email;
			updatedFields.push("email");
		}
	}

	if (requested.has("portrait")) {
		const portrait = claims.picture ?? claims.portrait;
		if (portrait) {
			updates.portrait = portrait;
			updatedFields.push("portrait");
		}
	}

	if (requested.has("resident_address")) {
		const addressFromObject =
			claims.address && typeof claims.address === "object"
				? (claims.address.formatted ??
					[
						claims.address.street_address,
						claims.address.locality,
						claims.address.region,
						claims.address.postal_code,
						claims.address.country,
					]
						.filter(Boolean)
						.join(", "))
				: undefined;
		const address =
			claims.resident_address ??
			(typeof claims.address === "string" ? claims.address : undefined) ??
			addressFromObject;
		if (address) {
			updates.address = address;
			updatedFields.push("address");
		}
	}

	return { updates, updatedFields };
}

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
	);

	const user = getUserByIdentifier(claims.personal_administrative_number);
	if (!user) {
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
	);

	const existingUser = getUserByIdentifier(
		claims.personal_administrative_number,
	);
	if (existingUser) {
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
		updateRequestToFailed(
			pendingRequest.id,
			"Invalid payment metadata for pending request.",
		);
		return;
	}

	const claims = await getExtractedCredentials(
		pendingRequest.vidosAuthorizationId,
		paymentClaimsSchema,
	);
	const user = getUserById(parsed.data.userId);

	if (!user || user.identifier !== claims.personal_administrative_number) {
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
		updateRequestToFailed(
			pendingRequest.id,
			"Invalid loan metadata for pending request.",
		);
		return;
	}

	const claims = await getExtractedCredentials(
		pendingRequest.vidosAuthorizationId,
		loanClaimsSchema,
	);
	const user = getUserById(parsed.data.userId);

	if (!user || user.identifier !== claims.personal_administrative_number) {
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
		updateRequestToFailed(
			pendingRequest.id,
			"Invalid profile update metadata for pending request.",
		);
		return;
	}

	const claims = await getExtractedCredentials(
		pendingRequest.vidosAuthorizationId,
		profileUpdateClaimsExtendedSchema,
	);
	const user = getUserById(parsed.data.userId);

	if (!user) {
		updateRequestToFailed(pendingRequest.id, "Unauthorized");
		return;
	}

	if (
		claims.personal_administrative_number &&
		claims.personal_administrative_number !== user.identifier
	) {
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
