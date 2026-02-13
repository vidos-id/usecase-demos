import { Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import type { DcApiRequest } from "shared/types/auth";
import { Button } from "@/components/ui/button";

// DC API types per W3C Digital Credentials spec
interface DCApiRequestOptions extends CredentialRequestOptions {
	digital?: {
		requests: DcApiRequest[];
	};
}

interface DCApiCredential extends Credential {
	protocol: string;
	data: Record<string, unknown>;
}

interface DCApiHandlerProps {
	dcApiRequest: DcApiRequest;
	onSuccess: (response: {
		protocol: string;
		data: Record<string, unknown>;
	}) => void;
	onError: (error: string) => void;
}

// Browser global type for DC API feature detection
interface DigitalCredentialGlobal {
	userAgentAllowsProtocol: (protocol: string) => boolean;
}

/**
 * Get the DigitalCredential browser global if available
 */
function getDigitalCredentialGlobal(): DigitalCredentialGlobal | undefined {
	return (window as unknown as { DigitalCredential?: DigitalCredentialGlobal })
		.DigitalCredential;
}

/**
 * Check DC API browser support
 * Spec: https://www.w3.org/TR/digital-credentials/#feature-detection
 */
function checkDCAPISupport(protocol?: string): {
	available: boolean;
	reason?: string;
} {
	if (typeof navigator === "undefined") {
		return { available: false, reason: "Not in browser environment" };
	}

	const digitalCredential = getDigitalCredentialGlobal();
	if (!digitalCredential) {
		return {
			available: false,
			reason: "DigitalCredential interface not available",
		};
	}

	// Check if protocol is allowed by user agent
	if (protocol && !digitalCredential.userAgentAllowsProtocol(protocol)) {
		return {
			available: false,
			reason: `Protocol "${protocol}" not supported by user agent`,
		};
	}

	if (!navigator.credentials) {
		return {
			available: false,
			reason: "Credentials API not available in this browser",
		};
	}

	if (typeof navigator.credentials.get !== "function") {
		return { available: false, reason: "credentials.get() not available" };
	}

	return { available: true };
}

export function DCApiHandler({
	dcApiRequest,
	onSuccess,
	onError,
}: DCApiHandlerProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleConnect = async () => {
		// Check browser support with protocol validation
		const support = checkDCAPISupport(dcApiRequest.protocol);
		if (!support.available) {
			onError(support.reason || "DC API not supported");
			return;
		}

		setIsLoading(true);
		try {
			const credential = await navigator.credentials.get({
				digital: { requests: [dcApiRequest] },
			} as DCApiRequestOptions);

			if (!credential) {
				throw new Error("No credential returned");
			}

			// Cast to DCApiCredential per spec
			const digitalCredential = credential as DCApiCredential;
			onSuccess({
				protocol: digitalCredential.protocol,
				data: digitalCredential.data,
			});
		} catch (err) {
			if (err instanceof Error) {
				if (err.name === "AbortError") {
					onError("Wallet selection was cancelled");
				} else {
					onError(err.message);
				}
			} else {
				onError("Unknown error occurred");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center space-y-4 pt-6">
			<Button onClick={handleConnect} disabled={isLoading} size="lg">
				{isLoading ? (
					<>
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						Connecting...
					</>
				) : (
					<>
						<Wallet className="w-4 h-4 mr-2" />
						Connect Wallet
					</>
				)}
			</Button>

			<p className="text-sm text-muted-foreground text-center max-w-xs">
				Click to open your browser's wallet and select your identity credential.
			</p>
		</div>
	);
}
