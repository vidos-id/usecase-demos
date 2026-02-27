import { getMissingVerificationFields } from "@/domain/booking/booking-machine";
import type { BookingState } from "@/domain/booking/booking-types";
import {
	MDL_CREDENTIAL_ID,
	MDL_DOC_TYPE,
	MDL_NAMESPACE,
} from "@/domain/verification/verification-constants";
import {
	type VerificationRequest,
	verificationRequestSchema,
} from "@/domain/verification/verification-schemas";

type BuildVerificationRequestOptions = {
	nonceFactory?: () => string;
	requestIdFactory?: () => string;
	previousNonce?: string | null;
};

type BuildVerificationRequestResult =
	| {
			ok: true;
			request: VerificationRequest;
	  }
	| {
			ok: false;
			error: string;
	  };

function createId(prefix: string): string {
	return `${prefix}_${crypto.randomUUID()}`;
}

export function createVerificationNonce(): string {
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}

export function buildVerificationRequestFromBooking(
	booking: BookingState,
	options: BuildVerificationRequestOptions = {},
): BuildVerificationRequestResult {
	if (!booking.bookingId) {
		return { ok: false, error: "Missing bookingId for verification request" };
	}

	const missing = getMissingVerificationFields(booking.rentalDetails);
	if (missing.length > 0) {
		return {
			ok: false,
			error: `Missing required booking data: ${missing.join(", ")}`,
		};
	}

	const nonceFactory = options.nonceFactory ?? createVerificationNonce;
	const requestIdFactory = options.requestIdFactory ?? (() => createId("vrf"));
	const nonce = nonceFactory();

	if (options.previousNonce && nonce === options.previousNonce) {
		return {
			ok: false,
			error: "Generated nonce must be fresh for each authorization request",
		};
	}

	const credentials = [
		{
			id: MDL_CREDENTIAL_ID,
			kind: "mdl" as const,
			format: "mso_mdoc" as const,
			required: true,
			purpose: "Verify driving licence eligibility for rental release",
			claims: [
				{
					id: "given_name",
					path: [MDL_NAMESPACE, "given_name"],
					required: true,
				},
				{
					id: "family_name",
					path: [MDL_NAMESPACE, "family_name"],
					required: true,
				},
				{
					id: "birth_date",
					path: [MDL_NAMESPACE, "birth_date"],
					required: true,
				},
				{
					id: "document_number",
					path: [MDL_NAMESPACE, "document_number"],
					required: true,
				},
				{
					id: "expiry_date",
					path: [MDL_NAMESPACE, "expiry_date"],
					required: true,
				},
				{
					id: "driving_privileges",
					path: [MDL_NAMESPACE, "driving_privileges"],
					required: true,
				},
				{
					id: "portrait",
					path: [MDL_NAMESPACE, "portrait"],
					required: false,
				},
			],
			meta: {
				doctype_value: MDL_DOC_TYPE,
			},
		},
	] as const;

	const parsed = verificationRequestSchema.safeParse({
		requestId: requestIdFactory(),
		bookingId: booking.bookingId,
		nonce,
		createdAt: new Date().toISOString(),
		purpose: "Car rental identity verification",
		query: {
			type: "DCQL",
			credentials,
		},
	});

	if (!parsed.success) {
		return {
			ok: false,
			error: "Generated verification request failed schema validation",
		};
	}

	return {
		ok: true,
		request: parsed.data,
	};
}
