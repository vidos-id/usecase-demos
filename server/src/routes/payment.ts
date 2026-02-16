import { randomUUID } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	paymentCompleteRequestSchema,
	paymentCompleteResponseSchema,
	paymentRequestResponseSchema,
	paymentRequestSchema,
	paymentStatusResponseSchema,
} from "shared/api/payment";
import { PAYMENT_CLAIMS, PAYMENT_PURPOSE } from "shared/lib/claims";
import { paymentClaimsSchema } from "shared/types/auth";
import { vidosErrorTypes } from "shared/types/vidos-errors";
import {
	createAuthorizationRequest,
	forwardDCAPIResponse,
	getExtractedCredentials,
	pollAuthorizationStatus,
} from "../services/vidos";
import {
	createPendingRequest,
	deletePendingRequest,
	getPendingRequestById,
} from "../stores/pending-auth-requests";
import { getSessionById } from "../stores/sessions";
import { getUserById, updateUser } from "../stores/users";

// Helper to extract session from Authorization header
function getSession(c: {
	req: { header: (name: string) => string | undefined };
}) {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) return null;
	return getSessionById(authHeader.slice(7));
}

export const paymentRouter = new Hono()
	.post("/request", zValidator("json", paymentRequestSchema), async (c) => {
		const session = getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { recipient, amount, reference, ...modeParams } = c.req.valid("json");

		// Generate transactionId immediately per spec
		const transactionId = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

		// Build transaction data for OID4VP cryptographic binding
		const transactionData = [
			Buffer.from(
				JSON.stringify({
					type: "payment",
					recipient,
					amount,
					reference,
					transactionId,
				}),
			).toString("base64url"),
		];

		const result = await createAuthorizationRequest({
			...modeParams,
			requestedClaims: PAYMENT_CLAIMS,
			purpose: PAYMENT_PURPOSE,
			transactionData,
			verifierInfo: [
				{
					format: "plaintext",
					data: "Demo Bank - Secure Payment Authorization",
				},
			],
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "payment",
			mode: modeParams.mode,
			responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
			metadata: { transactionId, recipient, amount, reference },
		});

		const response = paymentRequestResponseSchema.parse(
			result.mode === "direct_post"
				? {
						mode: "direct_post",
						requestId: pendingRequest.id,
						transactionId,
						authorizeUrl: result.authorizeUrl,
						requestedClaims: PAYMENT_CLAIMS,
						purpose: PAYMENT_PURPOSE,
					}
				: {
						mode: "dc_api",
						requestId: pendingRequest.id,
						transactionId,
						dcApiRequest: result.dcApiRequest,
						requestedClaims: PAYMENT_CLAIMS,
						purpose: PAYMENT_PURPOSE,
					},
		);

		return c.json(response);
	})
	.get("/status/:requestId", async (c) => {
		const session = getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const requestId = c.req.param("requestId");
		const pendingRequest = getPendingRequestById(requestId);

		if (!pendingRequest) {
			return c.json({ error: "Request not found" }, 404);
		}

		const statusResult = await pollAuthorizationStatus(
			pendingRequest.vidosAuthorizationId,
		);

		if (statusResult.status === "authorized") {
			// Verify identity matches session user
			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
				paymentClaimsSchema,
			);
			const user = getUserById(session.userId);

			if (!user || user.identifier !== claims.personal_administrative_number) {
				deletePendingRequest(pendingRequest.id);
				return c.json({
					status: "rejected" as const,
					errorInfo: {
						errorType: vidosErrorTypes.identityMismatch,
						title: "Identity Mismatch",
						detail:
							"The credential used for verification does not match your account identity.",
					},
				});
			}

			// Use transactionId from stored metadata
			const metadata = pendingRequest.metadata as {
				transactionId: string;
				recipient: string;
				amount: string;
				reference?: string;
			};
			deletePendingRequest(pendingRequest.id);

			// Append activity and update balance (direct_post flow)
			const paymentAmount = Number(metadata.amount);
			const activityItem = {
				id: randomUUID(),
				type: "payment" as const,
				title: `Payment to ${metadata.recipient}`,
				amount: -paymentAmount,
				createdAt: new Date().toISOString(),
				meta: {
					recipient: metadata.recipient,
					reference: metadata.reference,
				},
			};
			updateUser(user.id, {
				balance: user.balance - paymentAmount,
				activity: [activityItem, ...user.activity],
			});

			const response = paymentStatusResponseSchema.parse({
				status: "authorized" as const,
				transactionId: metadata.transactionId,
				claims: {
					familyName: claims.family_name,
					givenName: claims.given_name,
					identifier: claims.personal_administrative_number,
				},
			});

			return c.json(response);
		}

		const response = paymentStatusResponseSchema.parse({
			status: statusResult.status,
			errorInfo: statusResult.errorInfo,
		});

		return c.json(response);
	})
	.post(
		"/complete/:requestId",
		zValidator("json", paymentCompleteRequestSchema),
		async (c) => {
			const session = getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			const requestId = c.req.param("requestId");
			const { origin, dcResponse } = c.req.valid("json");

			const pendingRequest = getPendingRequestById(requestId);
			if (!pendingRequest) {
				return c.json({ error: "Request not found or expired" }, 404);
			}

			const result = await forwardDCAPIResponse({
				authorizationId: pendingRequest.vidosAuthorizationId,
				origin,
				dcResponse: dcResponse as
					| { response: string }
					| { vp_token: Record<string, unknown> },
			});

			if (result.status !== "authorized") {
				return c.json(
					{
						error: "Verification failed",
						errorInfo: result.errorInfo,
					},
					400,
				);
			}

			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
				paymentClaimsSchema,
			);
			const user = getUserById(session.userId);

			if (!user || user.identifier !== claims.personal_administrative_number) {
				deletePendingRequest(pendingRequest.id);
				return c.json(
					{
						error: "Identity mismatch",
						errorInfo: {
							errorType: vidosErrorTypes.identityMismatch,
							title: "Identity Mismatch",
							detail:
								"The credential used for verification does not match your account identity.",
						},
					},
					400,
				);
			}

			// Use transactionId from stored metadata
			const metadata = pendingRequest.metadata as {
				transactionId: string;
				recipient: string;
				amount: string;
				reference?: string;
			};
			const confirmedAt = new Date().toISOString();

			deletePendingRequest(pendingRequest.id);

			// Append activity and update balance
			const paymentAmount = Number(metadata.amount);
			const activityItem = {
				id: randomUUID(),
				type: "payment" as const,
				title: `Payment to ${metadata.recipient}`,
				amount: -paymentAmount,
				createdAt: confirmedAt,
				meta: {
					recipient: metadata.recipient,
					reference: metadata.reference,
				},
			};
			updateUser(user.id, {
				balance: user.balance - paymentAmount,
				activity: [activityItem, ...user.activity],
			});

			const response = paymentCompleteResponseSchema.parse({
				transactionId: metadata.transactionId,
				confirmedAt,
				recipient: metadata.recipient,
				amount: metadata.amount,
				reference: metadata.reference,
				verifiedIdentity: {
					familyName: claims.family_name,
					givenName: claims.given_name,
					identifier: claims.personal_administrative_number,
				},
				transaction: {
					id: metadata.transactionId,
					recipient: metadata.recipient,
					amount: metadata.amount,
					reference: metadata.reference,
					confirmedAt,
				},
			});

			return c.json(response);
		},
	);
