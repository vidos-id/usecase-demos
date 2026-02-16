import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import {
	type LoanAuthMetadata,
	loanAuthMetadataSchema,
	type PaymentAuthMetadata,
	type ProfileUpdateAuthMetadata,
	paymentAuthMetadataSchema,
	profileUpdateAuthMetadataSchema,
} from "shared/types/auth-metadata";
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

export const updateRequestToCompleted = (
	id: string,
	claims: Record<string, unknown>,
	sessionId?: string,
): void => {
	const result = { claims, sessionId };
	const updated = db
		.update(pendingAuthRequestsTable)
		.set({
			status: "completed",
			completedAt: new Date().toISOString(),
			result,
		})
		.where(eq(pendingAuthRequestsTable.id, id))
		.returning({
			vidosAuthorizationId: pendingAuthRequestsTable.vidosAuthorizationId,
		})
		.get();

	// Emit event for any listeners waiting on this authorization
	if (updated?.vidosAuthorizationId) {
		appEvents.emit("authRequestResolved", {
			authorizationId: updated.vidosAuthorizationId,
			status: "completed",
		});
	}
};

export const updateRequestToFailed = (id: string, error: string): void => {
	const result = { claims: {}, error };
	const updated = db
		.update(pendingAuthRequestsTable)
		.set({
			status: "failed",
			completedAt: new Date().toISOString(),
			result,
		})
		.where(eq(pendingAuthRequestsTable.id, id))
		.returning({
			vidosAuthorizationId: pendingAuthRequestsTable.vidosAuthorizationId,
		})
		.get();

	// Emit event for any listeners waiting on this authorization
	if (updated?.vidosAuthorizationId) {
		appEvents.emit("authRequestResolved", {
			authorizationId: updated.vidosAuthorizationId,
			status: "failed",
		});
	}
};

export const updateRequestToExpired = (id: string): void => {
	const updated = db
		.update(pendingAuthRequestsTable)
		.set({
			status: "expired",
			completedAt: new Date().toISOString(),
		})
		.where(eq(pendingAuthRequestsTable.id, id))
		.returning({
			vidosAuthorizationId: pendingAuthRequestsTable.vidosAuthorizationId,
		})
		.get();

	// Emit event for any listeners waiting on this authorization
	if (updated?.vidosAuthorizationId) {
		appEvents.emit("authRequestResolved", {
			authorizationId: updated.vidosAuthorizationId,
			status: "expired",
		});
	}
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
