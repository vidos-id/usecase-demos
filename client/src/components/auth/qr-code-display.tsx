import { ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

interface QRCodeDisplayProps {
	url: string;
}

export function QRCodeDisplay({ url }: QRCodeDisplayProps) {
	const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

	return (
		<div className="flex flex-col items-center space-y-4">
			<div className="bg-white p-4 rounded-lg">
				<QRCodeSVG value={url} size={256} level="M" />
			</div>

			<Button variant="outline" asChild>
				<a href={url} target="_blank" rel="noopener noreferrer">
					<ExternalLink className="w-4 h-4 mr-2" />
					{isMobile ? "Open Wallet" : "Open on this device"}
				</a>
			</Button>

			<p className="text-sm text-muted-foreground text-center max-w-xs">
				Scan with your wallet app, or tap the button to open directly.
			</p>
		</div>
	);
}
