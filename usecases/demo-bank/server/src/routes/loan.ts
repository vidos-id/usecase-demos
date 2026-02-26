import { randomUUID } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";
import {
	loanCompleteRequestSchema,
	loanCompleteResponseSchema,
	loanRequestResponseSchema,
	loanRequestSchema,
} from "demo-bank-shared/api/loan";
import { LOAN_CLAIMS, LOAN_PURPOSE } from "demo-bank-shared/lib/claims";
import { loanAuthMetadataSchema } from "demo-bank-shared/types/auth-metadata";
import { loanClaimsSchema } from "demo-bank-shared/types/auth";
import { vidosErrorTypes } from "demo-bank-shared/types/vidos-errors";
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

function getSession(c: Context) {
	return getSessionFromRequest(c);
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

		// Build transaction data for OID4VP cryptographic binding
		const transactionData = [
			Buffer.from(
				JSON.stringify({
					type: "loan_application",
					amount,
					loanPurpose,
					term,
				}),
			).toString("base64url"),
		];

		const result = await createAuthorizationRequest({
			...modeParams,
			requestedClaims: LOAN_CLAIMS,
			purpose: LOAN_PURPOSE,
			transactionData,
			verifierInfo: [
				{
					format: "plaintext",
					data: "Demo Bank - Loan Application Identity Verification",
				},
			],
		});

		const pendingRequest = createPendingRequest({
			vidosAuthorizationId: result.authorizationId,
			type: "loan",
			mode: modeParams.mode,
			responseUrl: result.mode === "dc_api" ? result.responseUrl : undefined,
			metadata: {
				userId: session.userId,
				amount,
				purpose: loanPurpose,
				term,
			},
		});

		startAuthorizationMonitor(pendingRequest.id);

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
	.get("/stream/:requestId", (c) => {
		return streamAuthorizationRequest(c, {
			flowType: "loan",
			authorize: (ctx, pendingRequest) => {
				const session = getSession(ctx);
				if (!session) {
					return { ok: false, status: 401, message: "Unauthorized" } as const;
				}
				const parsed = loanAuthMetadataSchema.safeParse(
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

			const parsedMetadata = loanAuthMetadataSchema.safeParse(
				pendingRequest.metadata,
			);
			if (
				!parsedMetadata.success ||
				parsedMetadata.data.userId !== session.userId
			) {
				return c.json({ error: "Unauthorized" }, 403);
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

			const loanRequestId = `loan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

			// Append loan activity and update balance + pendingLoansTotal
			const metadata = parsedMetadata.data;
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

			updateRequestToCompleted(pendingRequest.id, claims, undefined, {
				status: "authorized",
				loanRequestId,
			});

			const response = loanCompleteResponseSchema.parse({
				loanRequestId,
				message:
					"We'll review your application and contact you within 2 business days.",
			});

			return c.json(response);
		},
	);
