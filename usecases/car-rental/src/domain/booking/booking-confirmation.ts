import { z } from "zod";
import type {
	NormalizedDisclosedClaims,
	VerificationPolicy,
} from "@/domain/verification/verification-schemas";

const confirmationFieldSchema = z.object({
	value: z.string(),
	isFallback: z.boolean(),
});

const lockerAssignmentSchema = z.object({
	lockerId: z.string().min(1),
	lockerPin: z.string().length(4),
});

const pickupInstructionsSchema = z.object({
	locationName: z.string().min(1),
	guidance: z.array(z.string().min(1)).min(1),
	locker: lockerAssignmentSchema,
});

const credentialHighlightsSchema = z.object({
	fullName: confirmationFieldSchema,
	mdlNumber: confirmationFieldSchema,
	mdlExpiry: confirmationFieldSchema,
	drivingPrivileges: confirmationFieldSchema.optional(),
	portrait: z.string().nullable(),
	portraitFallbackLabel: z.string().min(1),
});

export const bookingConfirmationPayloadSchema = z.object({
	bookingReference: z.string().min(1),
	eligibilityStatement: z.string().min(1),
	pickup: pickupInstructionsSchema,
	credentialHighlights: credentialHighlightsSchema,
	createdAt: z.string().min(1),
});

export type BookingConfirmationPayload = z.infer<
	typeof bookingConfirmationPayloadSchema
>;

const DEFAULT_FIELD_FALLBACK = "Not disclosed";
const DEFAULT_PORTRAIT_FALLBACK = "Portrait unavailable";

function hashSeed(seed: string): number {
	let hash = 0;
	for (const char of seed) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	}

	return hash;
}

function asField(value: string | undefined, fallback = DEFAULT_FIELD_FALLBACK) {
	return {
		value: value ?? fallback,
		isFallback: value === undefined,
	};
}

function toTitleCase(value: string): string {
	if (value.length === 0) {
		return value;
	}

	return value[0].toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeDrivingPrivileges(value: unknown): string | undefined {
	if (!Array.isArray(value) || value.length === 0) {
		return undefined;
	}

	const labels = value
		.map((entry) => {
			if (typeof entry === "string" && entry.trim().length > 0) {
				return entry.trim().toUpperCase();
			}

			if (entry && typeof entry === "object") {
				const category = (entry as Record<string, unknown>)
					.vehicle_category_code;
				if (typeof category === "string" && category.trim().length > 0) {
					return category.trim().toUpperCase();
				}
			}

			return undefined;
		})
		.filter((entry): entry is string => entry !== undefined);

	if (labels.length === 0) {
		return undefined;
	}

	return labels.join(", ");
}

export function createDeterministicLockerAssignment(
	seed: string,
	locationCode: string | undefined,
): z.infer<typeof lockerAssignmentSchema> {
	const hash = hashSeed(seed);
	const zones = ["A", "B", "C", "D"];
	const zone = zones[hash % zones.length];
	const lockerNumber = ((hash % 180) + 20).toString().padStart(3, "0");
	const prefix = (locationCode ?? "HUB")
		.replace(/[^A-Z0-9]/gi, "")
		.toUpperCase();
	const lockerPin = ((hash % 9000) + 1000).toString();

	return {
		lockerId: `${prefix}-${zone}${lockerNumber}`,
		lockerPin,
	};
}

export function deriveEligibilityStatement(
	policy: VerificationPolicy | null,
): string {
	if (!policy || policy.overallStatus === "unknown") {
		return "Eligible for rental release. Verification details are unavailable for this booking.";
	}

	if (policy.overallStatus === "pass") {
		return "Eligible for rental release based on accepted mobile driving licence attributes.";
	}

	return "Eligibility warning: verification checks reported issues with presented credentials.";
}

export function createPickupGuidance(locationName: string): string[] {
	return [
		`Proceed to the self-pickup lockers at ${locationName}.`,
		"Use the locker ID and PIN below at the kiosk touchscreen.",
		"Collect keys and inspect vehicle before exiting the parking zone.",
	];
}

export function buildCredentialHighlights(
	disclosedClaims: NormalizedDisclosedClaims | null,
) {
	const given = disclosedClaims?.mdl.givenName;
	const family = disclosedClaims?.mdl.familyName;
	const fullNameValue = [given, family].filter(Boolean).join(" ").trim();
	const fullName = fullNameValue.length > 0 ? fullNameValue : undefined;

	const privileges = normalizeDrivingPrivileges(
		disclosedClaims?.mdl.drivingPrivileges,
	);

	return {
		fullName: asField(fullName),
		mdlNumber: asField(disclosedClaims?.mdl.documentNumber),
		mdlExpiry: asField(disclosedClaims?.mdl.expiryDate),
		drivingPrivileges: privileges ? asField(privileges) : undefined,
		portrait: disclosedClaims?.mdl.portrait ?? null,
		portraitFallbackLabel:
			fullName !== undefined
				? `${
						fullName
							.split(" ")
							.slice(0, 2)
							.map((part) => toTitleCase(part).charAt(0))
							.join("") || DEFAULT_PORTRAIT_FALLBACK
					}`
				: DEFAULT_PORTRAIT_FALLBACK,
	};
}

export function createBookingConfirmationPayload(input: {
	bookingReference: string;
	locationCode?: string;
	locationName: string;
	policy: VerificationPolicy | null;
	disclosedClaims: NormalizedDisclosedClaims | null;
	now?: string;
}): BookingConfirmationPayload {
	const locker = createDeterministicLockerAssignment(
		input.bookingReference,
		input.locationCode,
	);

	return bookingConfirmationPayloadSchema.parse({
		bookingReference: input.bookingReference,
		eligibilityStatement: deriveEligibilityStatement(input.policy),
		pickup: {
			locationName: input.locationName,
			guidance: createPickupGuidance(input.locationName),
			locker,
		},
		credentialHighlights: buildCredentialHighlights(input.disclosedClaims),
		createdAt: input.now ?? new Date().toISOString(),
	});
}
