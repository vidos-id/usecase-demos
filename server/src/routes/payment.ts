import { randomUUID } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { type Context, Hono } from "hono";
import {
	paymentCompleteRequestSchema,
	paymentCompleteResponseSchema,
	paymentRequestResponseSchema,
	paymentRequestSchema,
} from "shared/api/payment";
import { PAYMENT_CLAIMS, PAYMENT_PURPOSE } from "shared/lib/claims";
import { paymentClaimsSchema } from "shared/types/auth";
import { paymentAuthMetadataSchema } from "shared/types/auth-metadata";
import { vidosErrorTypes } from "shared/types/vidos-errors";
import { getSessionFromRequest } from "../lib/request-session";
import { startAuthorizationMonitor } from "../services/authorization-monitor";
import { streamAuthorizationRequest } from "../services/authorization-stream";
import {
	createAuthorizationRequest,
	forwardDCAPIResponse,
	getExtractedCredentials,
} from "../services/vidos";
import {
	createPendingRequest,
	getPendingRequestById,
	updateRequestToCompleted,
	updateRequestToFailed,
} from "../stores/pending-auth-requests";
import { getUserById, updateUser } from "../stores/users";

// Helper to extract session from Authorization header or SSE query token
function getSession(c: Context) {
	return getSessionFromRequest(c);
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
		const requestId = randomUUID();

		const result = await createAuthorizationRequest(
			{
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
			},
			{ requestId, flowType: "payment" },
		);

		const pendingRequest = createPendingRequest({
			id: requestId,
			vidosAuthorizationId: result.authorizationId,
			type: "payment",
			mode: modeParams.mode,
			responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
			metadata: {
				userId: session.userId,
				transactionId,
				recipient,
				amount,
				reference,
			},
		});

		startAuthorizationMonitor(pendingRequest.id);

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
	.get("/stream/:requestId", (c) => {
		return streamAuthorizationRequest(c, {
			flowType: "payment",
			authorize: (ctx, pendingRequest) => {
				const session = getSession(ctx);
				if (!session) {
					return { ok: false, status: 401, message: "Unauthorized" } as const;
				}
				const parsed = paymentAuthMetadataSchema.safeParse(
					pendingRequest.metadata,
				);
				if (!parsed.success || parsed.data.userId !== session.userId) {
					return { ok: false, status: 403, message: "Unauthorized" } as const;
				}
				return { ok: true } as const;
			},
		});
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

			const parsedMetadata = paymentAuthMetadataSchema.safeParse(
				pendingRequest.metadata,
			);
			if (
				!parsedMetadata.success ||
				parsedMetadata.data.userId !== session.userId
			) {
				return c.json({ error: "Unauthorized" }, 403);
			}

			const result = await forwardDCAPIResponse(
				{
					authorizationId: pendingRequest.vidosAuthorizationId,
					origin,
					dcResponse: dcResponse as
						| { response: string }
						| { vp_token: Record<string, unknown> },
				},
				{
					requestId: pendingRequest.id,
					flowType: pendingRequest.type,
				},
			);

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
				updateRequestToFailed(
					pendingRequest.id,
					"The credential used for verification does not match your account identity.",
					{
						errorType: vidosErrorTypes.identityMismatch,
						title: "Identity Mismatch",
						detail:
							"The credential used for verification does not match your account identity.",
					},
					{ status: "rejected" },
				);
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

			const metadata = parsedMetadata.data;
			const confirmedAt = new Date().toISOString();

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

			updateRequestToCompleted(pendingRequest.id, claims, undefined, {
				status: "authorized",
				transactionId: metadata.transactionId,
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
