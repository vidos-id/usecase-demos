import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
	authorizationConnectedEventSchema,
	authorizationStreamEventSchema,
} from "demo-bank-shared/api/authorization-sse";
import {
	type LoanAuthMetadata,
	loanAuthMetadataSchema,
	type PaymentAuthMetadata,
	type ProfileUpdateAuthMetadata,
	paymentAuthMetadataSchema,
	profileUpdateAuthMetadataSchema,
} from "demo-bank-shared/types/auth-metadata";
import type { AuthorizationErrorInfo } from "demo-bank-shared/types/vidos-errors";
import { db } from "../db";
import {
	type PendingAuthMetadata,
	type PendingAuthRequest,
	pendingAuthMetadataSchema,
	pendingAuthRequests as pendingAuthRequestsTable,
	pendingAuthResultSchema,
} from "../db/schema";
import { appEvents } from "../lib/events";

export type { PendingAuthRequest };

type BaseCreateInput = {
	vidosAuthorizationId: string;
	mode: "direct_post" | "dc_api";
	responseUrl?: string;
	completedAt?: Date;
	result?: PendingAuthRequest["result"];
};

type SignupCreateInput = BaseCreateInput & {
	type: "signup";
	metadata?: undefined;
};

type SigninCreateInput = BaseCreateInput & {
	type: "signin";
	metadata?: undefined;
};

type PaymentCreateInput = BaseCreateInput & {
	type: "payment";
	metadata: PaymentAuthMetadata;
};

type LoanCreateInput = BaseCreateInput & {
	type: "loan";
	metadata: LoanAuthMetadata;
};

type ProfileUpdateCreateInput = BaseCreateInput & {
	type: "profile_update";
	metadata: ProfileUpdateAuthMetadata;
};

export type CreatePendingRequestInput =
	| SignupCreateInput
	| SigninCreateInput
	| PaymentCreateInput
	| LoanCreateInput
	| ProfileUpdateCreateInput;

export type PendingRequestResultPatch = Partial<
	NonNullable<PendingAuthRequest["result"]>
>;

function validateMetadata(
	type: CreatePendingRequestInput["type"],
	metadata: unknown,
): PendingAuthMetadata | undefined {
	switch (type) {
		case "payment":
			return paymentAuthMetadataSchema.parse(metadata);
		case "loan":
			return loanAuthMetadataSchema.parse(metadata);
		case "profile_update":
			return profileUpdateAuthMetadataSchema.parse(metadata);
		case "signup":
		case "signin":
			if (metadata !== undefined && metadata !== null) {
				throw new Error(`Unexpected metadata for ${type} request`);
			}
			return undefined;
	}
}

// Default TTL for all requests (10 minutes for signup/signin)
const DEFAULT_REQUEST_TTL_MS = 10 * 60 * 1000;
// Short TTL for loan/payment requests (5 minutes per spec)
const SHORT_REQUEST_TTL_MS = 5 * 60 * 1000;

type PendingAuthRow = typeof pendingAuthRequestsTable.$inferSelect;

const parseMetadata = (
	raw: PendingAuthRow["metadata"],
): PendingAuthRequest["metadata"] => {
	if (raw === null || raw === undefined) {
		return undefined;
	}
	if (typeof raw === "string") {
		return pendingAuthMetadataSchema.parse(JSON.parse(raw));
	}
	return pendingAuthMetadataSchema.parse(raw);
};

const parseResult = (
	raw: PendingAuthRow["result"],
): PendingAuthRequest["result"] => {
	if (raw === null || raw === undefined) {
		return undefined;
	}
	if (typeof raw === "string") {
		return pendingAuthResultSchema.parse(JSON.parse(raw));
	}
	return pendingAuthResultSchema.parse(raw);
};

const mapRowToPendingAuthRequest = (
	row: PendingAuthRow,
): PendingAuthRequest => {
	return {
		id: row.id,
		vidosAuthorizationId: row.vidosAuthorizationId,
		type: row.type as PendingAuthRequest["type"],
		mode: row.mode as PendingAuthRequest["mode"],
		status: row.status as PendingAuthRequest["status"],
		responseUrl: row.responseUrl ?? undefined,
		metadata: parseMetadata(row.metadata),
		createdAt: new Date(row.createdAt),
		completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
		result: parseResult(row.result),
	};
};

const mapResolvedStatus = (
	eventType:
		| "authorized"
		| "expired"
		| "not_found"
		| "account_exists"
		| "rejected"
		| "error",
): "completed" | "failed" | "expired" => {
	if (eventType === "authorized") {
		return "completed";
	}
	if (eventType === "expired") {
		return "expired";
	}
	return "failed";
};

const toAuthorizationStateEvent = (
	request: PendingAuthRequest,
): ReturnType<typeof authorizationStreamEventSchema.parse> => {
	if (request.status === "pending") {
		return authorizationStreamEventSchema.parse({
			eventType: "pending",
		});
	}

	const result = request.result;
	const resolvedStatus =
		result?.status ??
		(request.status === "expired"
			? "expired"
			: result?.errorInfo
				? "rejected"
				: "error");

	if (resolvedStatus === "authorized") {
		return authorizationStreamEventSchema.parse({
			eventType: "authorized",
			sessionId: result?.sessionId,
			mode: result?.mode ?? request.mode,
			transactionId: result?.transactionId,
			loanRequestId: result?.loanRequestId,
			updatedFields: result?.updatedFields,
		});
	}

	if (resolvedStatus === "expired") {
		return authorizationStreamEventSchema.parse({
			eventType: "expired",
		});
	}

	if (resolvedStatus === "not_found") {
		return authorizationStreamEventSchema.parse({
			eventType: "not_found",
			message: result?.error ?? "No account found with this credential.",
		});
	}

	if (resolvedStatus === "account_exists") {
		return authorizationStreamEventSchema.parse({
			eventType: "account_exists",
			message: result?.error ?? "Account already exists.",
		});
	}

	if (resolvedStatus === "rejected") {
		return authorizationStreamEventSchema.parse({
			eventType: "rejected",
			message: result?.error ?? "Verification was rejected.",
			errorInfo: result?.errorInfo,
		});
	}

	return authorizationStreamEventSchema.parse({
		eventType: "error",
		message: result?.error ?? "Verification failed.",
		errorInfo: result?.errorInfo,
	});
};

const emitAuthorizationEvent = (
	request: PendingAuthRequest,
	eventType: "connected" | "state",
): void => {
	const event =
		eventType === "connected"
			? authorizationConnectedEventSchema.parse({ eventType })
			: toAuthorizationStateEvent(request);

	appEvents.emit("authorizationRequestEvent", {
		requestId: request.id,
		authorizationId: request.vidosAuthorizationId,
		flowType: request.type,
		event,
	});

	if (
		eventType === "state" &&
		event.eventType !== "connected" &&
		event.eventType !== "pending"
	) {
		appEvents.emit("authRequestResolved", {
			authorizationId: request.vidosAuthorizationId,
			status: mapResolvedStatus(event.eventType),
		});
	}
};

export const createPendingRequest = (
	data: CreatePendingRequestInput,
): PendingAuthRequest => {
	const normalizedMetadata = validateMetadata(data.type, data.metadata);

	const id = randomUUID();
	const createdAt = new Date();

	const row: typeof pendingAuthRequestsTable.$inferInsert = {
		id,
		vidosAuthorizationId: data.vidosAuthorizationId,
		type: data.type,
		mode: data.mode,
		status: "pending",
		responseUrl: data.responseUrl ?? null,
		metadata: normalizedMetadata ?? null,
		createdAt: createdAt.toISOString(),
		completedAt: null,
		result: null,
	};

	db.insert(pendingAuthRequestsTable).values(row).run();

	return {
		id,
		vidosAuthorizationId: data.vidosAuthorizationId,
		type: data.type,
		mode: data.mode,
		status: "pending",
		responseUrl: data.responseUrl,
		metadata: normalizedMetadata,
		createdAt,
	};
};

function getRequestTtl(type: string): number {
	// Loan and payment requests have shorter TTL per spec
	if (type === "loan" || type === "payment") {
		return SHORT_REQUEST_TTL_MS;
	}
	return DEFAULT_REQUEST_TTL_MS;
}

export const getPendingRequestById = (
	id: string,
): PendingAuthRequest | undefined => {
	const row = db
		.select()
		.from(pendingAuthRequestsTable)
		.where(eq(pendingAuthRequestsTable.id, id))
		.get();
	if (!row) {
		return undefined;
	}
	const createdAt = new Date(row.createdAt);
	const ttl = getRequestTtl(row.type);
	if (Date.now() - createdAt.getTime() > ttl) {
		updateRequestToExpired(row.id);
		return undefined;
	}
	return mapRowToPendingAuthRequest(row);
};

export const getPendingRequestByAuthId = (
	vidosAuthorizationId: string,
): PendingAuthRequest | undefined => {
	const row = db
		.select()
		.from(pendingAuthRequestsTable)
		.where(
			eq(pendingAuthRequestsTable.vidosAuthorizationId, vidosAuthorizationId),
		)
		.get();
	if (!row) {
		return undefined;
	}
	const createdAt = new Date(row.createdAt);
	const ttl = getRequestTtl(row.type);
	if (Date.now() - createdAt.getTime() > ttl) {
		updateRequestToExpired(row.id);
		return undefined;
	}
	return mapRowToPendingAuthRequest(row);
};

const updatePendingRequestTerminal = (
	id: string,
	nextStatus: "completed" | "failed" | "expired",
	resultPatch: PendingRequestResultPatch,
): PendingAuthRequest | undefined => {
	const nowIso = new Date().toISOString();
	const row = db
		.update(pendingAuthRequestsTable)
		.set({
			status: nextStatus,
			completedAt: nowIso,
			result: Object.keys(resultPatch).length > 0 ? resultPatch : null,
		})
		.where(
			and(
				eq(pendingAuthRequestsTable.id, id),
				eq(pendingAuthRequestsTable.status, "pending"),
			),
		)
		.returning()
		.get();

	if (!row) {
		const existing = db
			.select()
			.from(pendingAuthRequestsTable)
			.where(eq(pendingAuthRequestsTable.id, id))
			.get();
		if (!existing) {
			return undefined;
		}
		return mapRowToPendingAuthRequest(existing);
	}

	const updated = mapRowToPendingAuthRequest(row);
	emitAuthorizationEvent(updated, "state");
	return updated;
};

export const updateRequestToCompleted = (
	id: string,
	claims: Record<string, unknown>,
	sessionId?: string,
	extras?: PendingRequestResultPatch,
): PendingAuthRequest | undefined => {
	return updatePendingRequestTerminal(id, "completed", {
		status: "authorized",
		claims,
		sessionId,
		...extras,
	});
};

export const updateRequestToFailed = (
	id: string,
	error: string,
	errorInfo?: AuthorizationErrorInfo,
	extras?: PendingRequestResultPatch,
): PendingAuthRequest | undefined => {
	return updatePendingRequestTerminal(id, "failed", {
		status: errorInfo ? "rejected" : "error",
		error,
		errorInfo,
		...extras,
	});
};

export const updateRequestToExpired = (
	id: string,
	extras?: PendingRequestResultPatch,
): PendingAuthRequest | undefined => {
	return updatePendingRequestTerminal(id, "expired", {
		status: "expired",
		...extras,
	});
};

export const emitAuthorizationConnected = (requestId: string): void => {
	const request = getPendingRequestById(requestId);
	if (!request) {
		return;
	}
	emitAuthorizationEvent(request, "connected");
};

export const getAuthorizationStreamStateByRequestId = (
	requestId: string,
): ReturnType<typeof authorizationStreamEventSchema.parse> | undefined => {
	const request = getPendingRequestById(requestId);
	if (!request) {
		return undefined;
	}
	return toAuthorizationStateEvent(request);
};

export const listPendingRequests = (): PendingAuthRequest[] => {
	const rows = db
		.select()
		.from(pendingAuthRequestsTable)
		.where(eq(pendingAuthRequestsTable.status, "pending"))
		.all();
	return rows.map(mapRowToPendingAuthRequest);
};

export const deletePendingRequest = (id: string): void => {
	db.delete(pendingAuthRequestsTable)
		.where(eq(pendingAuthRequestsTable.id, id))
		.run();
};

export const clearAllPendingRequests = (): void => {
	db.delete(pendingAuthRequestsTable).run();
};
