import { ExternalLink, QrCode, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

interface QRCodeDisplayProps {
	url: string;
}

export function QRCodeDisplay({ url }: QRCodeDisplayProps) {
	const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

	return (
		<div className="relative py-4 animate-fade-in">
			{/* Main container with layered depth */}
			<div className="relative mx-auto w-fit">
				{/* Decorative corner accents */}
				<div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
				<div className="absolute -top-2 -right-2 w-5 h-5 border-r-2 border-t-2 border-primary/40 rounded-tr-lg" />
				<div className="absolute -bottom-2 -left-2 w-5 h-5 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
				<div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />

				{/* QR Code frame */}
				<div className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-border/60 rounded-2xl p-4 shadow-lg shadow-primary/5">
					{/* Inner label */}
					<div className="flex items-center justify-center gap-2 mb-3">
						<div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
							<QrCode className="w-3.5 h-3.5 text-primary" />
						</div>
						<span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
							Scan with Wallet
						</span>
					</div>

					{/* QR Code with styled frame */}
					<div className="relative mx-auto w-fit">
						{/* Subtle glow behind QR */}
						<div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-75 opacity-50" />

						{/* QR container */}
						<div className="relative bg-white p-3 rounded-xl shadow-inner border border-border/40">
							<QRCodeSVG
								value={url}
								size={240}
								level="M"
								bgColor="transparent"
								fgColor="#1a1a2e"
							/>
						</div>
					</div>

					{/* Scanning animation hint */}
					<div className="mt-3 flex items-center justify-center gap-2 text-muted-foreground">
						<div className="flex gap-1">
							<div
								className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse"
								style={{ animationDelay: "0ms" }}
							/>
							<div
								className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse"
								style={{ animationDelay: "150ms" }}
							/>
							<div
								className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse"
								style={{ animationDelay: "300ms" }}
							/>
						</div>
						<span className="text-xs">Awaiting scan</span>
					</div>
				</div>

				{/* Divider with "or" */}
				<div className="relative my-4">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-border/60" />
					</div>
					<div className="relative flex justify-center">
						<span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground font-mono">
							or
						</span>
					</div>
				</div>

				{/* Action button */}
				<Button
					variant="outline"
					className="w-full h-11 rounded-xl border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all group"
					asChild
				>
					<a href={url} target="_blank" rel="noopener noreferrer">
						<Smartphone className="w-4 h-4 mr-2 text-primary" />
						<span>{isMobile ? "Open Wallet App" : "Open on this device"}</span>
						<ExternalLink className="w-3 h-3 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
					</a>
				</Button>

				{/* Helper text */}
				<p className="mt-3 text-xs text-muted-foreground text-center leading-relaxed">
					Point your wallet app at the code above, or tap the button to open
					directly on this device.
				</p>
			</div>
		</div>
	);
}
