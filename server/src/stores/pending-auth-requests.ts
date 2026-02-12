import { randomUUID } from "crypto";
import type { PendingAuthRequest } from "../types/pending-auth-request";

const pendingAuthRequests = new Map<string, PendingAuthRequest>();

const REQUEST_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

export const getPendingRequestById = (
	id: string,
): PendingAuthRequest | undefined => {
	const request = pendingAuthRequests.get(id);
	if (!request) {
		return undefined;
	}
	// Check if expired
	if (Date.now() - request.createdAt.getTime() > REQUEST_TTL_MS) {
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
			// Check if expired
			if (Date.now() - request.createdAt.getTime() > REQUEST_TTL_MS) {
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
