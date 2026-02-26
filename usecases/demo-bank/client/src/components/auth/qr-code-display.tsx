import { ExternalLink, QrCode, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface QRCodeDisplayProps {
	url: string;
}

function detectMobileDevice() {
	if (typeof navigator === "undefined" || typeof window === "undefined") {
		return false;
	}

	const userAgent = navigator.userAgent || "";
	const navigatorWithUAData = navigator as Navigator & {
		userAgentData?: { mobile?: boolean };
	};
	const uaDataMobile =
		typeof navigatorWithUAData.userAgentData?.mobile === "boolean"
			? navigatorWithUAData.userAgentData.mobile
			: false;
	const mobileUserAgent =
		/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
			userAgent,
		);
	const hasCoarsePointer =
		typeof window.matchMedia === "function" &&
		window.matchMedia("(pointer: coarse)").matches;
	const hasTouch = navigator.maxTouchPoints > 0;

	return uaDataMobile || mobileUserAgent || (hasCoarsePointer && hasTouch);
}

export function QRCodeDisplay({ url }: QRCodeDisplayProps) {
	const isMobile = useMemo(detectMobileDevice, []);
	const [showQrOnMobile, setShowQrOnMobile] = useState(false);
	const desktopLinkProps = {
		target: "_blank",
		rel: "noopener noreferrer",
	};

	return (
		<div className="relative py-4 animate-fade-in">
			<div className="relative mx-auto w-fit">
				{isMobile ? (
					<div className="space-y-3 w-[272px]">
						<Button
							className="w-full h-11 rounded-xl transition-all group"
							asChild
						>
							<a href={url}>
								<Smartphone className="w-4 h-4 mr-2" />
								<span>Open Wallet App</span>
								<ExternalLink className="w-3 h-3 ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
							</a>
						</Button>
						<Button
							variant="outline"
							className="w-full h-11 rounded-xl border-primary/30 hover:bg-primary/5 hover:border-primary/50"
							onClick={() => setShowQrOnMobile((value) => !value)}
						>
							<QrCode className="w-4 h-4 mr-2 text-primary" />
							{showQrOnMobile ? "Hide QR code" : "Use another device (show QR)"}
						</Button>
						{showQrOnMobile && (
							<div className="relative pt-2">
								<div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
								<div className="absolute -top-2 -right-2 w-5 h-5 border-r-2 border-t-2 border-primary/40 rounded-tr-lg" />
								<div className="absolute -bottom-2 -left-2 w-5 h-5 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
								<div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
								<div className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-border/60 rounded-2xl p-4 shadow-lg shadow-primary/5">
									<div className="flex items-center justify-center gap-2 mb-3">
										<div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
											<QrCode className="w-3.5 h-3.5 text-primary" />
										</div>
										<span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
											Scan with Wallet
										</span>
									</div>
									<div className="relative mx-auto w-fit">
										<div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-75 opacity-50" />
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
							</div>
						)}
						<p className="text-xs text-muted-foreground text-center leading-relaxed">
							Open your wallet app directly on this phone. If needed, reveal the
							QR to continue on a different device.
						</p>
					</div>
				) : (
					<>
						<div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
						<div className="absolute -top-2 -right-2 w-5 h-5 border-r-2 border-t-2 border-primary/40 rounded-tr-lg" />
						<div className="absolute -bottom-2 -left-2 w-5 h-5 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
						<div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
						<div className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-border/60 rounded-2xl p-4 shadow-lg shadow-primary/5">
							<div className="flex items-center justify-center gap-2 mb-3">
								<div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
									<QrCode className="w-3.5 h-3.5 text-primary" />
								</div>
								<span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
									Scan with Wallet
								</span>
							</div>
							<div className="relative mx-auto w-fit">
								<div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-75 opacity-50" />
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
						<Button
							variant="outline"
							className="w-full h-11 rounded-xl border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all group"
							asChild
						>
							<a href={url} {...desktopLinkProps}>
								<Smartphone className="w-4 h-4 mr-2 text-primary" />
								<span>Open on this device</span>
								<ExternalLink className="w-3 h-3 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
							</a>
						</Button>
						<p className="mt-3 text-xs text-muted-foreground text-center leading-relaxed">
							Point your wallet app at the code above, or tap the button to open
							directly on this device.
						</p>
					</>
				)}
			</div>
		</div>
	);
}
