import { randomUUID } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	loanCompleteRequestSchema,
	loanCompleteResponseSchema,
	loanRequestResponseSchema,
	loanRequestSchema,
	loanStatusResponseSchema,
} from "shared/api/loan";
import { LOAN_CLAIMS, LOAN_PURPOSE } from "shared/lib/claims";
import { loanClaimsSchema } from "shared/types/auth";
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

		const {
			amount,
			purpose: loanPurpose,
			term,
			...modeParams
		} = c.req.valid("json");

		const result = await createAuthorizationRequest({
			...modeParams,
			requestedClaims: LOAN_CLAIMS,
			purpose: LOAN_PURPOSE,
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "loan",
			mode: modeParams.mode,
			responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
			metadata: { amount, purpose: loanPurpose, term },
		});

		const response = loanRequestResponseSchema.parse(
			result.mode === "direct_post"
				? {
						mode: "direct_post",
						requestId: pendingRequest.id,
						authorizeUrl: result.authorizeUrl,
						requestedClaims: LOAN_CLAIMS,
						purpose: LOAN_PURPOSE,
					}
				: {
						mode: "dc_api",
						requestId: pendingRequest.id,
						dcApiRequest: result.dcApiRequest,
						requestedClaims: LOAN_CLAIMS,
						purpose: LOAN_PURPOSE,
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
				loanClaimsSchema,
			);
			const user = getUserById(session.userId);

			if (!user || user.identifier !== claims.personal_administrative_number) {
				return c.json({ error: "Identity mismatch" }, 403);
			}

			const loanRequestId = `loan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
			deletePendingRequest(pendingRequest.id);

			// Append loan activity and update balance + pendingLoansTotal (direct_post flow)
			const metadata = pendingRequest.metadata as {
				amount: string;
				purpose: string;
				term: string;
			};
			const loanAmount = Number(metadata.amount);
			const activityItem = {
				id: randomUUID(),
				type: "loan" as const,
				title: "Loan application submitted",
				amount: loanAmount,
				createdAt: new Date().toISOString(),
				meta: {
					loanAmount,
					loanPurpose: metadata.purpose,
					loanTerm: Number(metadata.term),
				},
			};
			updateUser(user.id, {
				balance: user.balance + loanAmount,
				pendingLoansTotal: user.pendingLoansTotal + loanAmount,
				activity: [activityItem, ...user.activity],
			});

			const response = loanStatusResponseSchema.parse({
				status: "authorized" as const,
				loanRequestId,
				claims: {
					familyName: claims.family_name,
					givenName: claims.given_name,
					identifier: claims.personal_administrative_number,
				},
			});

			return c.json(response);
		}

		const response = loanStatusResponseSchema.parse({
			status: statusResult.status,
			errorInfo: statusResult.errorInfo,
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
				loanClaimsSchema,
			);
			const user = getUserById(session.userId);

			if (!user || user.identifier !== claims.personal_administrative_number) {
				return c.json({ error: "Identity mismatch" }, 403);
			}

			const loanRequestId = `loan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
			deletePendingRequest(pendingRequest.id);

			// Append loan activity and update balance + pendingLoansTotal
			const metadata = pendingRequest.metadata as {
				amount: string;
				purpose: string;
				term: string;
			};
			const loanAmount = Number(metadata.amount);
			const activityItem = {
				id: randomUUID(),
				type: "loan" as const,
				title: "Loan application submitted",
				amount: loanAmount,
				createdAt: new Date().toISOString(),
				meta: {
					loanAmount,
					loanPurpose: metadata.purpose,
					loanTerm: Number(metadata.term),
				},
			};
			updateUser(user.id, {
				balance: user.balance + loanAmount,
				pendingLoansTotal: user.pendingLoansTotal + loanAmount,
				activity: [activityItem, ...user.activity],
			});

			const response = loanCompleteResponseSchema.parse({
				loanRequestId,
				message:
					"We'll review your application and contact you within 2 business days.",
			});

			return c.json(response);
		},
	);
