import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	loanCompleteRequestSchema,
	loanCompleteResponseSchema,
	loanRequestResponseSchema,
	loanRequestSchema,
	loanStatusResponseSchema,
} from "shared/api/loan";
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

const LOAN_CLAIMS = [
	"family_name",
	"given_name",
	"personal_administrative_number",
	"document_number",
];

function getSession(c: {
	req: { header: (name: string) => string | undefined };
}) {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) return null;
	return getSessionById(authHeader.slice(7));
}

export const loanRouter = new Hono()
	.post("/request", zValidator("json", loanRequestSchema), async (c) => {
		const session = getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { amount, purpose, term } = c.req.valid("json");

		const result = await createAuthorizationRequest({
			mode: session.mode,
			requestedClaims: LOAN_CLAIMS,
			purpose: "Verify your identity for loan application",
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "loan",
			mode: session.mode,
			responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
			metadata: { amount, purpose, term },
		});

		const response = loanRequestResponseSchema.parse(
			result.mode === "direct_post"
				? {
						mode: "direct_post",
						requestId: pendingRequest.id,
						authorizeUrl: result.authorizeUrl,
					}
				: {
						mode: "dc_api",
						requestId: pendingRequest.id,
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
			const claims = await getExtractedCredentials(
				pendingRequest.vidosAuthorizationId,
			);
			const user = getUserById(session.userId);

			if (!user || user.identifier !== claims.identifier) {
				return c.json({ error: "Identity mismatch" }, 403);
			}

			const loanRequestId = `loan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
			deletePendingRequest(pendingRequest.id);

			const response = loanStatusResponseSchema.parse({
				status: "authorized" as const,
				loanRequestId,
				claims: {
					familyName: claims.familyName,
					givenName: claims.givenName,
					identifier: claims.identifier,
				},
			});

			return c.json(response);
		}

		const response = loanStatusResponseSchema.parse({
			status: statusResult.status,
		});

		return c.json(response);
	})
	.post(
		"/complete/:requestId",
		zValidator("json", loanCompleteRequestSchema),
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

			const loanRequestId = `loan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
			deletePendingRequest(pendingRequest.id);

			const response = loanCompleteResponseSchema.parse({
				loanRequestId,
				message:
					"We'll review your application and contact you within 2 business days.",
			});

			return c.json(response);
		},
	);
