import { randomUUID } from "crypto";
import type { PendingAuthRequest } from "../types/pending-auth-request";

const pendingAuthRequests = new Map<string, PendingAuthRequest>();

// Default TTL for all requests (10 minutes for signup/signin)
const DEFAULT_REQUEST_TTL_MS = 10 * 60 * 1000;
// Short TTL for loan/payment requests (5 minutes per spec)
const SHORT_REQUEST_TTL_MS = 5 * 60 * 1000;

export const createPendingRequest = (
	data: Omit<PendingAuthRequest, "id" | "status" | "createdAt">,
): PendingAuthRequest => {
	const request: PendingAuthRequest = {
		...data,
		id: randomUUID(),
		status: "pending",
		createdAt: new Date(),
	};
	pendingAuthRequests.set(request.id, request);
	return request;
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
	const request = pendingAuthRequests.get(id);
	if (!request) {
		return undefined;
	}
	// Check if expired based on request type
	const ttl = getRequestTtl(request.type);
	if (Date.now() - request.createdAt.getTime() > ttl) {
		pendingAuthRequests.delete(id);
		return undefined;
	}
	return request;
};

export const getPendingRequestByAuthId = (
	vidosAuthorizationId: string,
): PendingAuthRequest | undefined => {
	for (const request of pendingAuthRequests.values()) {
		if (request.vidosAuthorizationId === vidosAuthorizationId) {
			// Check if expired based on request type
			const ttl = getRequestTtl(request.type);
			if (Date.now() - request.createdAt.getTime() > ttl) {
				pendingAuthRequests.delete(request.id);
				return undefined;
			}
			return request;
		}
	}
	return undefined;
};

export const updateRequestToCompleted = (
	id: string,
	claims: Record<string, unknown>,
	sessionId?: string,
): void => {
	const request = pendingAuthRequests.get(id);
	if (!request) {
		return;
	}
	request.status = "completed";
	request.completedAt = new Date();
	request.result = {
		claims,
		sessionId,
	};
	pendingAuthRequests.set(id, request);
};

export const updateRequestToFailed = (id: string, error: string): void => {
	const request = pendingAuthRequests.get(id);
	if (!request) {
		return;
	}
	request.status = "failed";
	request.completedAt = new Date();
	request.result = {
		claims: {},
		error,
	};
	pendingAuthRequests.set(id, request);
};

export const updateRequestToExpired = (id: string): void => {
	const request = pendingAuthRequests.get(id);
	if (!request) {
		return;
	}
	request.status = "expired";
	request.completedAt = new Date();
	pendingAuthRequests.set(id, request);
};

export const listPendingRequests = (): PendingAuthRequest[] => {
	const result: PendingAuthRequest[] = [];
	for (const request of pendingAuthRequests.values()) {
		if (request.status === "pending") {
			result.push(request);
		}
	}
	return result;
};

export const deletePendingRequest = (id: string): void => {
	pendingAuthRequests.delete(id);
};
