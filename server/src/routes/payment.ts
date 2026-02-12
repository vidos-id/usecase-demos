import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	paymentCompleteRequestSchema,
	paymentCompleteResponseSchema,
	paymentRequestResponseSchema,
	paymentRequestSchema,
	paymentStatusResponseSchema,
} from "shared/api/payment";
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
import { getUserById } from "../stores/users";

// Minimal claims for payment confirmation
const PAYMENT_CLAIMS = [
	"family_name",
	"given_name",
	"personal_administrative_number",
	"document_number",
];

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

		const { recipient, amount, reference } = c.req.valid("json");

		// Generate transactionId immediately per spec
		const transactionId = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

		const result = await createAuthorizationRequest({
			mode: session.mode,
			requestedClaims: PAYMENT_CLAIMS,
			purpose: "Verify your identity for payment confirmation",
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "payment",
			mode: session.mode,
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
					}
				: {
						mode: "dc_api",
						requestId: pendingRequest.id,
						transactionId,
						dcApiRequest: result.dcApiRequest,
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
			);
			const user = getUserById(session.userId);

			if (!user || user.identifier !== claims.identifier) {
				return c.json({ error: "Identity mismatch" }, 403);
			}

			// Use transactionId from stored metadata
			const metadata = pendingRequest.metadata as {
				transactionId: string;
				recipient: string;
				amount: string;
				reference?: string;
			};
			deletePendingRequest(pendingRequest.id);

			const response = paymentStatusResponseSchema.parse({
				status: "authorized" as const,
				transactionId: metadata.transactionId,
				claims: {
					familyName: claims.familyName,
					givenName: claims.givenName,
					identifier: claims.identifier,
				},
			});

			return c.json(response);
		}

		const response = paymentStatusResponseSchema.parse({
			status: statusResult.status,
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
				return c.json({ error: "Verification failed" }, 400);
			}

			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
			);
			const user = getUserById(session.userId);

			if (!user || user.identifier !== claims.identifier) {
				return c.json({ error: "Identity mismatch" }, 403);
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

			const response = paymentCompleteResponseSchema.parse({
				transactionId: metadata.transactionId,
				confirmedAt,
				recipient: metadata.recipient,
				amount: metadata.amount,
				reference: metadata.reference,
				verifiedIdentity: {
					familyName: claims.familyName,
					givenName: claims.givenName,
					identifier: claims.identifier,
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
