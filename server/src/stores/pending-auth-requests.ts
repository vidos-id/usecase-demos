import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import {
	type PendingAuthMetadata,
	type PendingAuthRequest,
	type PendingAuthResult,
	pendingAuthMetadataSchema,
	pendingAuthRequests as pendingAuthRequestsTable,
	pendingAuthResultSchema,
} from "../db/schema";

export type { PendingAuthRequest };

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
	data: Omit<PendingAuthRequest, "id" | "status" | "createdAt">,
): PendingAuthRequest => {
	const id = randomUUID();
	const createdAt = new Date();

	const row: typeof pendingAuthRequestsTable.$inferInsert = {
		id,
		vidosAuthorizationId: data.vidosAuthorizationId,
		type: data.type,
		mode: data.mode,
		status: "pending",
		responseUrl: data.responseUrl ?? null,
		metadata: data.metadata
			? (JSON.stringify(data.metadata) as unknown as PendingAuthMetadata)
			: null,
		createdAt: createdAt.toISOString(),
		completedAt: null,
		result: null,
	};

	db.insert(pendingAuthRequestsTable).values(row).run();

	return {
		...data,
		id,
		status: "pending",
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
	db.update(pendingAuthRequestsTable)
		.set({
			status: "completed",
			completedAt: new Date().toISOString(),
			result: JSON.stringify(result) as unknown as PendingAuthResult,
		})
		.where(eq(pendingAuthRequestsTable.id, id))
		.run();
};

export const updateRequestToFailed = (id: string, error: string): void => {
	const result = { claims: {}, error };
	db.update(pendingAuthRequestsTable)
		.set({
			status: "failed",
			completedAt: new Date().toISOString(),
			result: JSON.stringify(result) as unknown as PendingAuthResult,
		})
		.where(eq(pendingAuthRequestsTable.id, id))
		.run();
};

export const updateRequestToExpired = (id: string): void => {
	db.update(pendingAuthRequestsTable)
		.set({
			status: "expired",
			completedAt: new Date().toISOString(),
		})
		.where(eq(pendingAuthRequestsTable.id, id))
		.run();
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
