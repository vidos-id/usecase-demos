import { z } from "zod";
import { failure, parseJsonBody, success } from "@/api/responses";
import {
	checkVerificationStatus,
	formatCheckoutStatusMessage,
	initiateCheckout,
} from "@/services/checkout";

const CheckoutRequestSchema = z.object({
	cartSessionId: z.string(),
});

const CheckoutPathSchema = z.object({
	checkoutSessionId: z.string(),
});

const POLL_INTERVAL_SECONDS = 3;
const POLL_TIMEOUT_SECONDS = 180;

export async function handleCheckoutRoutes(request: Request, pathname: string) {
	if (request.method === "POST" && pathname === "/api/checkout") {
		return handleInitiateCheckout(request);
	}

	const checkoutMatch = pathname.match(/^\/api\/checkout\/([^/]+)$/);
	if (request.method === "GET" && checkoutMatch) {
		return handleGetCheckoutStatus(checkoutMatch[1]!);
	}

	return failure("Not found.", 404);
}

async function handleInitiateCheckout(request: Request) {
	const parsed = await parseJsonBody(request, CheckoutRequestSchema);
	if (!parsed.success) {
		return parsed.response;
	}

	try {
		const { session, requiresVerification } = await initiateCheckout(
			parsed.data.cartSessionId,
		);

		return success(
			requiresVerification
				? "Checkout initiated. Age verification is required before the order can complete."
				: "Checkout initiated. No age verification is required.",
			{
				checkoutSessionId: session.sessionId,
				cartSessionId: session.cartSessionId,
				status: session.status,
				requiresVerification,
				authorizeUrl: session.verification?.authorizationUrl ?? null,
				instructions: requiresVerification
					? {
							qrCode:
								"Generate a QR code from authorizeUrl with the Node package `qrcode`.",
							scan: "Ask the user to scan the QR code with their digital identity wallet.",
							directLink:
								"Display authorizeUrl below the QR code so a phone user can open it directly.",
							mockPayment:
								"When status becomes verified, tell the user the wine was paid with a mock card and the order is confirmed.",
						}
					: null,
				polling: requiresVerification
					? {
							intervalSeconds: POLL_INTERVAL_SECONDS,
							timeoutSeconds: POLL_TIMEOUT_SECONDS,
						}
					: null,
			},
		);
	} catch (error) {
		return failure(
			`Failed to initiate checkout: ${error instanceof Error ? error.message : String(error)}`,
			400,
		);
	}
}

function handleGetCheckoutStatus(checkoutSessionId: string) {
	const parsed = CheckoutPathSchema.safeParse({ checkoutSessionId });
	if (!parsed.success) {
		return failure(`Invalid input: ${parsed.error.message}`, 400);
	}

	try {
		const session = checkVerificationStatus(parsed.data.checkoutSessionId);
		return success(formatCheckoutStatusMessage(session), {
			checkoutSessionId: session.sessionId,
			cartSessionId: session.cartSessionId,
			status: session.status,
			createdAt: session.createdAt,
			updatedAt: session.updatedAt,
			verification: session.verification
				? {
						lifecycle: session.verification.lifecycle,
						authorizationId: session.verification.authorizationId,
						authorizationUrl: session.verification.authorizationUrl,
						ageCheck: session.verification.ageCheck,
						lastError: session.verification.lastError,
						updatedAt: session.verification.updatedAt,
					}
				: null,
		});
	} catch (error) {
		return failure(
			`Failed to get checkout status: ${error instanceof Error ? error.message : String(error)}`,
			404,
		);
	}
}
