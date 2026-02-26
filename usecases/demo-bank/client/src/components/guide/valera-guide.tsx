import { Download, ExternalLink, Smartphone } from "lucide-react";
import { Callout, LinkButton, StepItem, WalletGuideSection } from "./shared";

export function ValeraGuide() {
	return (
		<WalletGuideSection
			icon={<Smartphone className="h-6 w-6" />}
			name="Valera Wallet"
			tagline="A-SIT Plus Wallet Demonstrator"
			compatibility="direct_post + DC API"
			downloadUrl="https://wallet.a-sit.at/"
			downloadLabel="Open Wallet Site"
			steps={[
				{
					title: "Install Valera Wallet",
					content: (
						<>
							<p>
								Download Valera from the official wallet site (Android APK or
								iOS TestFlight).
							</p>
							<LinkButton
								href="https://wallet.a-sit.at/"
								icon={<Download className="h-4 w-4" />}
							>
								Open Wallet Site
							</LinkButton>
						</>
					),
				},
				{
					title: "Issue a Credential",
					content: (
						<>
							<p>
								Use the Valera issuing flow to load your PID credential into the
								wallet.
							</p>
							<div className="space-y-3">
								<LinkButton
									href="https://wallet.a-sit.at/guide-issue.html"
									icon={<ExternalLink className="h-4 w-4" />}
								>
									Open Issuance Guide
								</LinkButton>
							</div>
						</>
					),
				},
				{
					title: "Authenticate with VidosDemoBank",
					content: (
						<>
							<ol className="space-y-3">
								<StepItem number={1}>
									Start a sign-up or sign-in flow in VidosDemoBank
								</StepItem>
								<StepItem number={2}>
									Open Valera and scan the QR code (or continue through deep
									link)
								</StepItem>
								<StepItem number={3}>
									Choose exactly one credential format: <strong>SD-JWT</strong>{" "}
									or <strong>mDoc</strong>
								</StepItem>
							</ol>
							<Callout variant="warning">
								<strong>Important:</strong> Valera currently does not support
								complex DCQL queries with credential sets. In VidosDemoBank
								flows, you need to select either SD-JWT or mDoc only.
							</Callout>
						</>
					),
				},
			]}
		/>
	);
}
