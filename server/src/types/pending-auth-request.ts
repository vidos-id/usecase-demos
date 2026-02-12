export interface PendingAuthRequest {
	id: string;
	vidosAuthorizationId: string;
	type: "signup" | "signin" | "payment" | "loan";
	mode: "direct_post" | "dc_api";
	status: "pending" | "completed" | "failed" | "expired";
	responseUrl?: string;
	metadata?: Record<string, unknown>;
	createdAt: Date;
	completedAt?: Date;
	result?: {
		claims: Record<string, unknown>;
		sessionId?: string;
		error?: string;
	};
}
