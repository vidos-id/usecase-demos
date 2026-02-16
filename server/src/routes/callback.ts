import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	type CallbackResolveResponse,
	callbackResolveRequestSchema,
	callbackResolveResponseSchema,
	type TransactionDetails,
} from "shared/api/callback";
import {
	loanAuthMetadataSchema,
	paymentAuthMetadataSchema,
} from "shared/types/auth-metadata";
import type { PendingAuthRequest } from "../db/schema";
import { appEvents } from "../lib/events";
import { resolveResponseCode } from "../services/vidos";
import { getPendingRequestByAuthId } from "../stores/pending-auth-requests";

// Configuration for waiting on application-level resolution
const MAX_WAIT_TIME_MS = 10_000; // 10 seconds

/**
 * Waits for pending request status to change from "pending" using event emitter.
 * Returns the final request state or undefined if not found.
 */
async function waitForResolution(
	authorizationId: string,
): Promise<PendingAuthRequest | undefined> {
	// Check current state first
	const request = getPendingRequestByAuthId(authorizationId);
	if (!request) return undefined;
	if (request.status !== "pending") return request;

	// Wait for resolution event or timeout
	return new Promise<PendingAuthRequest | undefined>((resolve) => {
		const timeoutId = setTimeout(() => {
			appEvents.off("authRequestResolved", handler);
			// Return current state on timeout
			resolve(getPendingRequestByAuthId(authorizationId));
		}, MAX_WAIT_TIME_MS);

		const handler = (event: { authorizationId: string }) => {
			if (event.authorizationId === authorizationId) {
				clearTimeout(timeoutId);
				appEvents.off("authRequestResolved", handler);
				resolve(getPendingRequestByAuthId(authorizationId));
			}
		};

		appEvents.on("authRequestResolved", handler);
	});
}

/**
 * Extracts transaction details from pending request metadata based on flow type.
 */
function extractTransactionDetails(
	request: PendingAuthRequest,
): TransactionDetails | undefined {
	if (!request.metadata) return undefined;

	if (request.type === "payment") {
		const parsed = paymentAuthMetadataSchema.safeParse(request.metadata);
		if (!parsed.success) return undefined;
		return {
			type: "payment",
			recipient: parsed.data.recipient,
			amount: Number(parsed.data.amount),
			reference: parsed.data.reference,
		};
	}

	if (request.type === "loan") {
		const parsed = loanAuthMetadataSchema.safeParse(request.metadata);
		if (!parsed.success) return undefined;
		return {
			type: "loan",
			loanAmount: Number(parsed.data.amount),
			loanPurpose: parsed.data.purpose,
			loanTerm: Number(parsed.data.term),
		};
	}

	return undefined;
}

export const callbackRouter = new Hono().post(
	"/resolve",
	zValidator("json", callbackResolveRequestSchema),
	async (c) => {
		const { response_code } = c.req.valid("json");

		// Step 1: Resolve response_code with Vidos to get authorization_id
		let vidosResult: Awaited<ReturnType<typeof resolveResponseCode>>;
		try {
			vidosResult = await resolveResponseCode(response_code);
		} catch (error) {
			// 404 or other error from Vidos
			console.error("[Callback] resolveResponseCode failed:", error);
			return c.json(
				{
					error: "Invalid or expired response code",
					detail: error instanceof Error ? error.message : "Unknown error",
				},
				404,
			);
		}

		// Step 2: Wait for application-level resolution
		const pendingRequest = await waitForResolution(vidosResult.authorizationId);

		if (!pendingRequest) {
			// No pending request found for this authorization
			// This could happen if the authorization was created outside our system
			console.warn(
				"[Callback] No pending request found for authorization:",
				vidosResult.authorizationId,
			);
			return c.json(
				{
					error: "Authorization not found in system",
				},
				404,
			);
		}

		// Step 3: Build response based on final state
		const transactionDetails = extractTransactionDetails(pendingRequest);

		let response: CallbackResolveResponse;

		if (pendingRequest.status === "completed") {
			response = {
				status: "completed",
				flowType: pendingRequest.type,
				completedAt: pendingRequest.completedAt?.toISOString() ?? null,
				transactionDetails,
			};
		} else if (pendingRequest.status === "failed") {
			const result = pendingRequest.result as { error?: string } | undefined;
			response = {
				status: "failed",
				flowType: pendingRequest.type,
				completedAt: pendingRequest.completedAt?.toISOString() ?? null,
				transactionDetails,
				errorInfo: result?.error
					? {
							title: "Verification Failed",
							detail: result.error,
						}
					: {
							title: "Verification Failed",
							detail: "The verification could not be completed.",
						},
			};
		} else {
			// Still pending after timeout - return Vidos status
			response = {
				status: "pending",
				vidosStatus: vidosResult.status,
				flowType: pendingRequest.type,
				completedAt: null,
				transactionDetails,
			};
		}

		// Validate and return
		const validated = callbackResolveResponseSchema.parse(response);
		return c.json(validated);
	},
);
