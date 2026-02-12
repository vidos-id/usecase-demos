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
	getPendingRequestById,
	updateRequestToCompleted,
} from "../stores/pending-auth-requests";
import { getSessionById } from "../stores/sessions";
import { getUserById } from "../stores/users";

// Minimal attributes for payment confirmation
const PAYMENT_ATTRIBUTES = [
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

		const result = await createAuthorizationRequest({
			mode: session.mode,
			requestedAttributes: PAYMENT_ATTRIBUTES,
			flow: "payment",
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "payment",
			mode: session.mode,
			responseUrl: result.responseUrl,
			metadata: { recipient, amount, reference },
		});

		const response = paymentRequestResponseSchema.parse({
			requestId: pendingRequest.id,
			authorizeUrl: result.authorizeUrl,
			dcApiRequest: result.dcApiRequest,
		});

		return c.json(response);
	})
	.get("/status/:requestId", async (c) => {
		const session = getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const requestId = c.req.param("requestId");
		const pendingRequest = getPendingRequestById(requestId);

		if (!pendingRequest) {
			const response = paymentStatusResponseSchema.parse({
				status: "expired" as const,
			});
			return c.json(response);
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

			const transactionId = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
			updateRequestToCompleted(pendingRequest.id, claims, transactionId);

			const response = paymentStatusResponseSchema.parse({
				status: "authorized" as const,
				transactionId,
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

			const transactionId = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
			const metadata = pendingRequest.metadata as {
				recipient: string;
				amount: number;
				reference?: string;
			};

			updateRequestToCompleted(pendingRequest.id, claims, transactionId);

			const response = paymentCompleteResponseSchema.parse({
				transactionId,
				confirmedAt: new Date().toISOString(),
				recipient: metadata.recipient,
				amount: metadata.amount,
				reference: metadata.reference,
			});

			return c.json(response);
		},
	);
