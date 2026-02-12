import { Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Extend CredentialRequestOptions to include digital property
interface DigitalCredentialRequestOptions extends CredentialRequestOptions {
	digital?: Record<string, unknown>;
}

interface DCApiHandlerProps {
	dcApiRequest: Record<string, unknown>;
	onSuccess: (response: Record<string, unknown>) => void;
	onError: (error: string) => void;
}

export function DCApiHandler({
	dcApiRequest,
	onSuccess,
	onError,
}: DCApiHandlerProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleConnect = async () => {
		if (!("credentials" in navigator)) {
			onError("Digital Credentials API not supported in this browser");
			return;
		}

		setIsLoading(true);
		try {
			const credential = await navigator.credentials.get({
				digital: dcApiRequest,
			} as DigitalCredentialRequestOptions);

			if (!credential) {
				throw new Error("No credential returned");
			}

			// Extract the response from the credential
			const response = (
				credential as unknown as { response: Record<string, unknown> }
			).response;
			onSuccess(response);
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
		<div className="flex flex-col items-center space-y-4">
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
