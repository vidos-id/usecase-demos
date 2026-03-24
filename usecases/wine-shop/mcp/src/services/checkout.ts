import { randomUUID } from "node:crypto";
import type {
	CheckoutSession,
	VerificationState,
} from "@/schemas/verification";
import { startAuthorizationMonitor } from "@/services/authorization-monitor";
import { getCartSummary } from "@/services/shopping";
import { createAuthorization } from "@/services/vidos-client";
import { logDebug } from "@/utils/debug";

const checkoutSessions = new Map<string, CheckoutSession>();

export function createCheckoutSession(cartSessionId: string): CheckoutSession {
	const now = new Date().toISOString();
	const session: CheckoutSession = {
		sessionId: randomUUID(),
		cartSessionId,
		status: "pending",
		verification: null,
		createdAt: now,
		updatedAt: now,
	};
	checkoutSessions.set(session.sessionId, session);
	logDebug("checkout", "created checkout session", {
		checkoutSessionId: session.sessionId,
		cartSessionId,
	});
	return session;
}

export function getCheckoutSession(
	sessionId: string,
): CheckoutSession | undefined {
	return checkoutSessions.get(sessionId);
}

export function updateCheckoutSession(
	sessionId: string,
	updates: Partial<CheckoutSession>,
): CheckoutSession {
	const session = checkoutSessions.get(sessionId);
	if (!session) {
		throw new Error("Checkout session not found");
	}

	const updated = { ...session, ...updates };
	checkoutSessions.set(sessionId, updated);
	return updated;
}

export async function initiateCheckout(cartSessionId: string): Promise<{
	session: CheckoutSession;
	requiresVerification: boolean;
}> {
	logDebug("checkout", "initiate requested", { cartSessionId });
	const cartSummary = getCartSummary(cartSessionId);
	if (!cartSummary) {
		logDebug("checkout", "cart not found during initiate", { cartSessionId });
		throw new Error("Cart not found");
	}

	if (cartSummary.totalItems === 0) {
		logDebug("checkout", "cart empty during initiate", { cartSessionId });
		throw new Error("Cart is empty");
	}

	const session = createCheckoutSession(cartSessionId);

	if (cartSummary.requiresVerification) {
		logDebug("checkout", "verification required", {
			checkoutSessionId: session.sessionId,
			cartSessionId,
		});
		const authorization = await createAuthorization();
		logDebug("checkout", "authorization created", {
			checkoutSessionId: session.sessionId,
			authorizationId: authorization.authorizationId,
			hasAuthorizeUrl: Boolean(authorization.authorizeUrl),
		});

		const verification: VerificationState = {
			lifecycle: "created",
			authorizationId: authorization.authorizationId,
			authorizationUrl: authorization.authorizeUrl,
			policy: null,
			disclosedClaims: null,
			ageCheck: null,
			lastError: null,
			updatedAt: new Date().toISOString(),
		};

		session.verification = verification;
		session.status = "verifying";
		session.updatedAt = new Date().toISOString();
		checkoutSessions.set(session.sessionId, session);

		startAuthorizationMonitor(session.sessionId);
		logDebug("checkout", "authorization monitor started", {
			checkoutSessionId: session.sessionId,
		});

		return { session, requiresVerification: true };
	}

	logDebug("checkout", "checkout completed without verification", {
		checkoutSessionId: session.sessionId,
		cartSessionId,
	});
	return { session, requiresVerification: false };
}

export function checkVerificationStatus(
	checkoutSessionId: string,
): CheckoutSession {
	const session = checkoutSessions.get(checkoutSessionId);
	if (!session) {
		logDebug("checkout", "checkout session not found", { checkoutSessionId });
		throw new Error("Checkout session not found");
	}

	logDebug("checkout", "checkout status requested", {
		checkoutSessionId,
		status: session.status,
		verificationLifecycle: session.verification?.lifecycle,
	});
	return session;
}

export function formatCheckoutStatusMessage(session: CheckoutSession): string {
	switch (session.status) {
		case "pending":
			return "Checkout ready. No age verification needed.";

		case "verification_required":
			return "Age verification required. Scan the QR code to continue — call get_checkout_status again in 5 seconds.";

		case "verifying": {
			const lifecycle = session.verification?.lifecycle ?? "unknown";
			if (lifecycle === "authorized" || lifecycle === "completed") {
				return "Wallet proof received. Final verification checks are finishing — call get_checkout_status again in 3 seconds.";
			}

			if (lifecycle === "processing") {
				return "Verification in progress. Processing wallet proof — call get_checkout_status again in 3 seconds.";
			}

			return "Verification in progress. Waiting for QR scan — call get_checkout_status again in 5 seconds.";
		}

		case "verified": {
			const age = session.verification?.ageCheck;
			if (age) {
				return age.actualAge !== null
					? `Verification successful. Age confirmed: ${age.actualAge}.`
					: `Verification successful. ${age.requiredAge}+ eligibility confirmed.`;
			}
			return "Verification successful. Checkout can proceed.";
		}

		case "rejected": {
			const age = session.verification?.ageCheck;
			const error = session.verification?.lastError;
			if (age && !age.eligible) {
				return age.actualAge !== null
					? `Age verification failed. Buyer is ${age.actualAge}; minimum is ${age.requiredAge}.`
					: `Age verification failed. ${age.requiredAge}+ proof was not satisfied.`;
			}
			if (error) {
				return `Verification failed. ${error}`;
			}
			return "Verification was rejected. Purchase cannot proceed.";
		}

		case "expired":
			return "Verification expired. Restart checkout to generate a new QR code.";

		case "error": {
			const errorMsg = session.verification?.lastError ?? "Unknown error";
			return `Verification error. ${errorMsg}`;
		}

		case "completed":
			return "Checkout completed successfully.";

		default:
			return `Checkout status: ${session.status}`;
	}
}
