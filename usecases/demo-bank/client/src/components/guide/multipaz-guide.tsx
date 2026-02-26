import { Download, QrCode, Smartphone, Wallet } from "lucide-react";
import { LinkButton, MethodCard, StepItem, WalletGuideSection } from "./shared";

export function MultipazGuide() {
	return (
		<WalletGuideSection
			icon={<Wallet className="h-6 w-6" />}
			name="Multipaz Wallet"
			tagline="Cross-Platform Identity"
			compatibility="direct_post + DC API (Chrome)"
			downloadUrl="https://apps.multipaz.org/"
			downloadLabel="View Downloads Page"
			steps={[
				{
					title: "Install Multipaz Wallet",
					content: (
						<>
							<p>Download the Multipaz wallet from the official portal.</p>
							<LinkButton
								href="https://apps.multipaz.org/"
								icon={<Download className="h-4 w-4" />}
							>
								View Downloads Page
							</LinkButton>
						</>
					),
				},
				{
					title: "Issue a PID Document",
					content: (
						<>
							<p>
								Multipaz includes a built-in document store for issuing test
								credentials in both SD-JWT and mDoc formats.
							</p>
							<ol className="space-y-3 mt-4">
								<StepItem number={1}>Open the Multipaz app</StepItem>
								<StepItem number={2}>
									Navigate to the <strong>Document Store</strong>
								</StepItem>
								<StepItem number={3}>
									Issue a PID credential following the in-app prompts (SD-JWT or
									mDoc format)
								</StepItem>
							</ol>
						</>
					),
				},
				{
					title: "Triggering Authentication",
					content: (
						<>
							<p>
								Multipaz doesn't have a built-in QR scanner for OID4VP/DC API
								flows. Here are your options:
							</p>

							<div className="space-y-4 mt-4">
								<MethodCard
									icon={<QrCode className="h-5 w-5" />}
									title="Option A: External QR Scanner"
									description="Use your phone's camera or a QR scanner app to scan the code, then choose Multipaz to handle the link."
									note="Works reliably with direct_post. DC API support varies by scanner."
								/>

								<MethodCard
									icon={<Smartphone className="h-5 w-5" />}
									title="Option B: Deep Link"
									description="Navigate to VidosDemoBank directly on your phone and use the built-in deep link feature."
									note="Works on mobile browsers and supports direct_post and DC API."
								/>

								<MethodCard
									icon={<Smartphone className="h-5 w-5" />}
									title="Option C: DC API on Chrome"
									description="Open VidosDemoBank in Chrome on Android and start authentication to use the browser-native credential exchange."
									note="This is an alternative to QR scanning and deep links when Chrome prompts for Multipaz."
								/>
							</div>
						</>
					),
				},
			]}
		/>
	);
}
