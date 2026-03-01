export type VerificationLifecycleState =
	| "created"
	| "pending_wallet"
	| "processing"
	| "success"
	| "rejected"
	| "expired"
	| "error";

export type VerificationPolicyCheckStatus = "pass" | "fail" | "unknown";

export type VerificationPolicyCheck = {
	id: string;
	status: VerificationPolicyCheckStatus;
	message?: string;
	path: (string | number)[];
};

export type VerificationPolicy = {
	overallStatus: "pass" | "fail" | "unknown";
	checks: VerificationPolicyCheck[];
};

export type NormalizedPidClaims = {
	givenName?: string;
	familyName?: string;
	birthDate?: string;
	portrait?: string;
	ageInYears?: number;
	ageEqualOrOver?: Record<string, boolean>;
};

export type AgeCheckResult = {
	eligible: boolean;
	requiredAge: number;
	actualAge: number | null;
	birthDate: string | null;
	destination: string;
};

export type VerificationState = {
	lifecycle: VerificationLifecycleState;
	orderId: string | null;
	authorizerId: string | null;
	authorizationUrl: string | null;
	nonce: string | null;
	policy: VerificationPolicy | null;
	disclosedClaims: NormalizedPidClaims | null;
	ageCheck: AgeCheckResult | null;
	lastError: string | null;
	updatedAt: string;
};
