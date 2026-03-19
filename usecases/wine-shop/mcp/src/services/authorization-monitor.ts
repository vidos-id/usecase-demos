import type {
	AgeCheckResult,
	CheckoutSession,
	NormalizedPidClaims,
	VerificationLifecycleState,
	VerificationPolicy,
} from "@/schemas/verification";
import { getCheckoutSession, updateCheckoutSession } from "@/services/checkout";
import {
	type AuthorizerStatus,
	getAuthorizationStatus,
	getCredentials,
	getPolicyResponse,
} from "@/services/vidos-client";

const MONITOR_INTERVAL_MS = 2000;

const monitors = new Map<string, ReturnType<typeof setInterval>>();

const TERMINAL_STATES: AuthorizerStatus[] = [
	"authorized",
	"completed",
	"success",
	"rejected",
	"expired",
	"error",
];

function isTerminal(status: AuthorizerStatus): boolean {
	return TERMINAL_STATES.includes(status);
}

export function startAuthorizationMonitor(checkoutSessionId: string): void {
	if (monitors.has(checkoutSessionId)) {
		return;
	}

	const interval = setInterval(() => {
		void monitorTick(checkoutSessionId);
	}, MONITOR_INTERVAL_MS);

	monitors.set(checkoutSessionId, interval);

	void monitorTick(checkoutSessionId);
}

export function stopAuthorizationMonitor(checkoutSessionId: string): void {
	const interval = monitors.get(checkoutSessionId);
	if (!interval) {
		return;
	}
	clearInterval(interval);
	monitors.delete(checkoutSessionId);
}

async function monitorTick(checkoutSessionId: string): Promise<void> {
	const session = getCheckoutSession(checkoutSessionId);
	if (!session) {
		stopAuthorizationMonitor(checkoutSessionId);
		return;
	}

	if (!session.verification?.authorizationId) {
		stopAuthorizationMonitor(checkoutSessionId);
		return;
	}

	if (isTerminal(session.verification.lifecycle)) {
		stopAuthorizationMonitor(checkoutSessionId);
		return;
	}

	try {
		const status = await getAuthorizationStatus(
			session.verification.authorizationId,
		);

		if (isTerminal(status)) {
			await processTerminalState(session, status);
			stopAuthorizationMonitor(checkoutSessionId);
		} else {
			updateCheckoutSession(checkoutSessionId, {
				verification: {
					...session.verification,
					lifecycle: status as VerificationLifecycleState,
					updatedAt: new Date().toISOString(),
				},
				updatedAt: new Date().toISOString(),
			});
		}
	} catch (error) {
		console.error(
			`[Monitor] Failed to poll authorization for ${checkoutSessionId}:`,
			error,
		);
		updateCheckoutSession(checkoutSessionId, {
			verification: session.verification
				? {
						...session.verification,
						lifecycle: "error",
						lastError:
							error instanceof Error
								? error.message
								: "Authorization monitoring failed",
						updatedAt: new Date().toISOString(),
					}
				: null,
			status: "error",
			updatedAt: new Date().toISOString(),
		});
		stopAuthorizationMonitor(checkoutSessionId);
	}
}

async function processTerminalState(
	session: CheckoutSession,
	status: AuthorizerStatus,
): Promise<void> {
	if (
		status === "authorized" ||
		status === "completed" ||
		status === "success"
	) {
		await processSuccess(session);
	} else if (
		status === "rejected" ||
		status === "expired" ||
		status === "error"
	) {
		processFailure(session, status);
	}
}

async function processSuccess(session: CheckoutSession): Promise<void> {
	if (!session.verification?.authorizationId) {
		return;
	}

	const authId = session.verification.authorizationId;

	try {
		const [policyResponse, credentials] = await Promise.all([
			getPolicyResponse(authId),
			getCredentials(authId),
		]);

		const normalizedClaims = extractPidClaims(credentials);
		const ageCheck = evaluateAgeEligibility(normalizedClaims);
		const transformedPolicy = transformPolicyResponse({
			data: policyResponse,
			authorizationId: authId,
		});

		const newStatus = ageCheck.eligible ? "verified" : "rejected";
		const lastError = ageCheck.eligible
			? null
			: `Age verification failed: buyer is ${ageCheck.actualAge} years old, minimum required is ${ageCheck.requiredAge}`;

		updateCheckoutSession(session.sessionId, {
			status: newStatus,
			verification: {
				...session.verification,
				lifecycle: "success",
				policy: transformedPolicy,
				disclosedClaims: normalizedClaims,
				ageCheck,
				lastError,
				updatedAt: new Date().toISOString(),
			},
			updatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error(
			`[Monitor] Failed to process successful authorization ${authId}:`,
			error,
		);
		updateCheckoutSession(session.sessionId, {
			status: "error",
			verification: session.verification
				? {
						...session.verification,
						lifecycle: "error",
						lastError:
							error instanceof Error
								? error.message
								: "Failed to process verification",
						updatedAt: new Date().toISOString(),
					}
				: null,
			updatedAt: new Date().toISOString(),
		});
	}
}

function processFailure(
	session: CheckoutSession,
	status: "rejected" | "expired" | "error",
): void {
	const statusMessages: Record<typeof status, string> = {
		rejected: "Verification was rejected by the wallet or policy check failed",
		expired: "Verification session expired before completion",
		error: "An error occurred during verification",
	};

	updateCheckoutSession(session.sessionId, {
		status,
		verification: session.verification
			? {
					...session.verification,
					lifecycle: status,
					lastError: statusMessages[status],
					updatedAt: new Date().toISOString(),
				}
			: null,
		updatedAt: new Date().toISOString(),
	});
}

function transformPolicyResponse(apiResponse: {
	data: unknown[];
	authorizationId: string;
}): VerificationPolicy {
	const data = apiResponse.data as Array<{
		path: (string | number)[];
		policy: string;
		service: string;
		error?: {
			type: string;
			title?: string;
			detail?: string;
		};
		data?: Record<string, unknown>;
	}>;

	const checks = data.map((item) => {
		let status: "pass" | "fail" | "unknown" = "unknown";
		let message: string | undefined;

		if (item.error) {
			status = "fail";
			message = item.error.detail || item.error.title;
		} else if (item.data) {
			status = "pass";
		}

		return {
			id: item.policy,
			status,
			path: item.path,
			message,
		};
	});

	let overallStatus: "pass" | "fail" | "unknown" = "unknown";
	if (checks.length > 0) {
		if (checks.every((c) => c.status === "pass")) {
			overallStatus = "pass";
		} else if (checks.some((c) => c.status === "fail")) {
			overallStatus = "fail";
		}
	}

	return { overallStatus, checks };
}

function extractPidClaims(
	credentials: Array<{
		path: (string | number)[];
		format: string;
		credentialType: string;
		claims: Record<string, unknown>;
	}>,
): NormalizedPidClaims {
	const pidCredential = credentials.find(
		(cred) =>
			cred.format === "dc+sd-jwt" ||
			cred.claims.birthdate !== undefined ||
			cred.claims.age_equal_or_over !== undefined,
	);

	if (!pidCredential) {
		return {
			givenName: null,
			familyName: null,
			birthDate: null,
			portrait: null,
		};
	}

	const claims = pidCredential.claims;

	return {
		givenName: typeof claims.given_name === "string" ? claims.given_name : null,
		familyName:
			typeof claims.family_name === "string" ? claims.family_name : null,
		birthDate: typeof claims.birthdate === "string" ? claims.birthdate : null,
		portrait: typeof claims.portrait === "string" ? claims.portrait : null,
		...(claims.age_equal_or_over !== undefined
			? { ageEqualOrOver: claims.age_equal_or_over }
			: {}),
	};
}

function evaluateAgeEligibility(claims: NormalizedPidClaims): AgeCheckResult {
	const MINIMUM_AGE = 18;
	const ageEqualOrOver = extractAgeThresholdClaim(claims);
	const result: AgeCheckResult = {
		eligible: false,
		requiredAge: MINIMUM_AGE,
		actualAge: null,
		birthDate: claims.birthDate,
	};

	if (ageEqualOrOver !== null) {
		result.eligible = ageEqualOrOver >= MINIMUM_AGE;
		result.birthDate = null;
		return result;
	}

	if (!claims.birthDate) {
		return result;
	}

	const birthDate = new Date(claims.birthDate);
	const today = new Date();

	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && today.getDate() < birthDate.getDate())
	) {
		age--;
	}

	result.actualAge = age;
	result.eligible = age >= MINIMUM_AGE;

	return result;
}

function extractAgeThresholdClaim(claims: NormalizedPidClaims): number | null {
	const raw = (
		claims as NormalizedPidClaims & {
			ageEqualOrOver?: number | string | boolean | Record<string, unknown>;
		}
	).ageEqualOrOver;

	if (typeof raw === "number") {
		return raw;
	}

	if (typeof raw === "string") {
		const parsed = Number(raw);
		return Number.isFinite(parsed) ? parsed : null;
	}

	if (!raw || typeof raw !== "object") {
		return null;
	}

	const age18 = (raw as Record<string, unknown>)["18"];
	if (age18 === true) {
		return 18;
	}

	if (typeof age18 === "string" && age18.toLowerCase() === "true") {
		return 18;
	}

	return null;
}

export function getActiveMonitorCount(): number {
	return monitors.size;
}
