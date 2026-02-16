import type { DcApiProtocol, PresentationMode } from "shared/types/auth";

// Browser global type for DC API feature detection
interface DigitalCredentialGlobal {
	userAgentAllowsProtocol: (protocol: string) => boolean;
}

function getDigitalCredentialGlobal(): DigitalCredentialGlobal | undefined {
	return (window as unknown as { DigitalCredential?: DigitalCredentialGlobal })
		.DigitalCredential;
}

/**
 * Known DC API protocols for browser feature detection
 * Note: Vidos protocols are defined in shared/types/auth.ts (DcApiProtocol)
 * This includes org-iso-mdoc for Safari detection (not supported by Vidos)
 */
const DETECTABLE_PROTOCOLS = [
	"openid4vp-v1-signed",
	"openid4vp-v1-unsigned",
	"openid4vp-v1-multisigned",
	"org-iso-mdoc", // Safari only supports this
] as const;

type DetectableProtocol = (typeof DETECTABLE_PROTOCOLS)[number];

export interface DCApiSupportResult {
	/** Whether DC API is supported for at least one Vidos protocol */
	supported: boolean;
	/** Whether DigitalCredential interface exists */
	hasDigitalCredential: boolean;
	/** Whether Credentials API exists */
	hasCredentialsApi: boolean;
	/** Protocol-specific support */
	protocols: Record<DetectableProtocol, boolean>;
	/** Human-readable reason if not supported */
	reason?: string;
	/** Detailed diagnostics for debugging */
	details: string[];
}

/**
 * Comprehensive DC API support check with protocol-level diagnostics
 *
 * Different browsers support different protocols:
 * - Chrome/Android: openid4vp-v1-signed, openid4vp-v1-unsigned, openid4vp-v1-multisigned
 * - Safari: org-iso-mdoc only (no OpenID4VP support)
 */
export function checkDCApiSupport(
	requiredProtocol?: DcApiProtocol | "org-iso-mdoc",
): DCApiSupportResult {
	const details: string[] = [];
	const protocols: DCApiSupportResult["protocols"] = {
		"openid4vp-v1-signed": false,
		"openid4vp-v1-unsigned": false,
		"openid4vp-v1-multisigned": false,
		"org-iso-mdoc": false,
	};

	// Check browser environment
	if (typeof window === "undefined" || typeof navigator === "undefined") {
		return {
			supported: false,
			hasDigitalCredential: false,
			hasCredentialsApi: false,
			protocols,
			reason: "Not in browser environment",
			details: ["Running in non-browser environment (SSR or Node.js)"],
		};
	}

	// Check Credentials API
	const hasCredentialsApi =
		"credentials" in navigator &&
		typeof navigator.credentials?.get === "function";
	if (!hasCredentialsApi) {
		details.push("Credentials API not available");
	} else {
		details.push("Credentials API available");
	}

	// Check DigitalCredential interface
	const digitalCredential = getDigitalCredentialGlobal();
	const hasDigitalCredential = !!digitalCredential;

	if (!hasDigitalCredential) {
		details.push("DigitalCredential interface not found in window");
		return {
			supported: false,
			hasDigitalCredential: false,
			hasCredentialsApi,
			protocols,
			reason: "Digital Credentials API not supported by this browser",
			details,
		};
	}

	details.push("DigitalCredential interface available");

	// Check each protocol
	for (const protocol of DETECTABLE_PROTOCOLS) {
		try {
			const allowed = digitalCredential.userAgentAllowsProtocol(protocol);
			protocols[protocol] = allowed;
			details.push(
				`Protocol "${protocol}": ${allowed ? "supported" : "not supported"}`,
			);
		} catch {
			protocols[protocol] = false;
			details.push(`Protocol "${protocol}": check failed (error)`);
		}
	}

	// Determine overall support
	const anyProtocolSupported = Object.values(protocols).some(Boolean);

	// If a specific protocol is required, check it
	if (requiredProtocol) {
		const requiredSupported = protocols[requiredProtocol];
		if (!requiredSupported) {
			// Build helpful message based on what IS supported
			const supportedProtocols = Object.entries(protocols)
				.filter(([, v]) => v)
				.map(([k]) => k);

			let reason: string;
			if (supportedProtocols.length === 0) {
				reason = `Protocol "${requiredProtocol}" not supported. No DC API protocols are supported by this browser.`;
			} else if (supportedProtocols.includes("org-iso-mdoc")) {
				reason = `This browser only supports "org-iso-mdoc" (ISO 18013-7). OpenID4VP protocols are not supported.`;
			} else {
				reason = `Protocol "${requiredProtocol}" not supported. Supported protocols: ${supportedProtocols.join(", ")}`;
			}

			return {
				supported: false,
				hasDigitalCredential,
				hasCredentialsApi,
				protocols,
				reason,
				details,
			};
		}
	}

	if (!anyProtocolSupported) {
		return {
			supported: false,
			hasDigitalCredential,
			hasCredentialsApi,
			protocols,
			reason: "No DC API protocols are supported by this browser",
			details,
		};
	}

	return {
		supported: true,
		hasDigitalCredential,
		hasCredentialsApi,
		protocols,
		details,
	};
}

/**
 * Simple boolean check - returns true if DC API is available with OpenID4VP support
 * This is the protocol our server uses.
 */
export function isDCApiSupported(): boolean {
	const result = checkDCApiSupport("openid4vp-v1-signed");
	return result.supported;
}

/**
 * Get detailed reason why DC API is not supported
 * Returns undefined if supported
 */
export function getDCApiUnsupportedReason(): string | undefined {
	const result = checkDCApiSupport("openid4vp-v1-signed");
	return result.reason;
}

export function getStoredMode(): PresentationMode {
	return (
		(localStorage.getItem("authMode") as PresentationMode) || "direct_post"
	);
}

export function setStoredMode(mode: PresentationMode): void {
	localStorage.setItem("authMode", mode);
}
