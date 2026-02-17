import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PollingStatusProps {
	onCancel: () => void;
}

export function PollingStatus({ onCancel }: PollingStatusProps) {
	return (
		<div className="flex flex-col items-center space-y-4">
			<Loader2 className="w-8 h-8 animate-spin text-primary" />

			<div className="text-center">
				<p className="font-medium">Waiting for wallet response...</p>
				<p className="text-sm text-muted-foreground">
					Complete the verification in your wallet app
				</p>
			</div>

			<Button variant="outline" onClick={onCancel}>
				Start Over
			</Button>
		</div>
	);
}
