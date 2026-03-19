export type VerificationLifecycleState =
	| "created"
	| "pending_wallet"
	| "processing"
	| "authorized"
	| "completed"
	| "success"
	| "rejected"
	| "expired"
	| "error";

export type VerificationPolicyCheckStatus = "pass" | "fail" | "unknown";

export interface VerificationPolicyCheck {
	id: string;
	status: VerificationPolicyCheckStatus;
	message?: string;
	path: Array<string | number>;
}

export interface VerificationPolicy {
	overallStatus: "pass" | "fail" | "unknown";
	checks: VerificationPolicyCheck[];
}

export interface NormalizedPidClaims {
	givenName: string | null;
	familyName: string | null;
	birthDate: string | null;
	portrait: string | null;
}

export interface AgeCheckResult {
	eligible: boolean;
	requiredAge: number;
	actualAge: number | null;
	birthDate: string | null;
}

export interface VerificationState {
	lifecycle: VerificationLifecycleState;
	authorizationId: string | null;
	authorizationUrl: string | null;
	policy: VerificationPolicy | null;
	disclosedClaims: NormalizedPidClaims | null;
	ageCheck: AgeCheckResult | null;
	lastError: string | null;
	updatedAt: string;
}

export type CheckoutSessionStatus =
	| "pending"
	| "verification_required"
	| "verifying"
	| "verified"
	| "rejected"
	| "expired"
	| "error"
	| "completed";

export interface CheckoutSession {
	sessionId: string;
	cartSessionId: string;
	status: CheckoutSessionStatus;
	verification: VerificationState | null;
	createdAt: string;
	updatedAt: string;
}
