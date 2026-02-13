import { Download, ExternalLink, Shield } from "lucide-react";
import { Callout, LinkButton, StepItem, WalletGuideSection } from "./shared";

export function EudiGuide() {
	return (
		<WalletGuideSection
			icon={<Shield className="h-6 w-6" />}
			name="EUDI Wallet"
			tagline="EU Reference Implementation"
			compatibility="direct_post"
			downloadUrl="https://github.com/vidos-id/eudi-app-android-wallet-ui/releases"
			downloadLabel="View GitHub Releases"
			steps={[
				{
					title: "Install the Vidos EUDI Wallet",
					content: (
						<>
							<p>
								Download the Vidos-customized EUDI wallet APK from our GitHub
								releases.
							</p>
							<LinkButton
								href="https://github.com/vidos-id/eudi-app-android-wallet-ui/releases"
								icon={<Download className="h-4 w-4" />}
							>
								View GitHub Releases
							</LinkButton>
						</>
					),
				},
				{
					title: "Issue a PID Credential",
					content: (
						<>
							<p>
								Navigate to the EU issuer portal and request a Person
								Identification Data (PID) credential.
							</p>
							<div className="space-y-3">
								<LinkButton
									href="https://issuer.eudiw.dev/display_credential_offer"
									icon={<ExternalLink className="h-4 w-4" />}
								>
									Open Credential Offer Page
								</LinkButton>
								<Callout>
									<strong>EUDI's guide:</strong>{" "}
									<a
										href="https://issuer.eudiw.dev/static/issuer_guides/credential_offer_guide_pre_auth.html"
										target="_blank"
										rel="noopener noreferrer"
										className="underline underline-offset-2 hover:text-primary transition-colors"
									>
										Credential Offer Guide (Pre-Auth)
									</a>
								</Callout>
							</div>
						</>
					),
				},
				{
					title: "Configure the Credential",
					content: (
						<ol className="space-y-3">
							<StepItem number={1}>
								Select <strong>PID (SD-JWT VC)</strong> as the credential type
							</StepItem>
							<StepItem number={2}>
								Scroll down and choose{" "}
								<strong>Pre-Authorization Code Grant</strong>
								<span className="block text-sm text-muted-foreground mt-1">
									This lets you fill the form on your PC instead of your phone
								</span>
							</StepItem>
							<StepItem number={3}>
								Fill in the <strong>predefined claims</strong>: birth date,
								family name, given name, nationalities, place of birth
							</StepItem>
							<StepItem number={4}>
								Add <strong>optional fields</strong>: document number, email,
								phone, personal administrative number
								<Callout variant="warning">
									<strong>Important:</strong> The personal administrative number
									will be used as your unique VidosDemoBank account ID. Make it
									something memorable!
								</Callout>
							</StepItem>
							<StepItem number={5}>
								Click <strong>Confirm</strong> to generate the credential offer
							</StepItem>
						</ol>
					),
				},
				{
					title: "Add Credential to Wallet",
					content: (
						<ol className="space-y-3">
							<StepItem number={1}>Open the EUDI wallet on your phone</StepItem>
							<StepItem number={2}>
								Go to <strong>Document</strong> tab
							</StepItem>
							<StepItem number={3}>
								Tap the <strong>+</strong> icon in the top right
							</StepItem>
							<StepItem number={4}>
								Select <strong>Scan</strong>
							</StepItem>
							<StepItem number={5}>
								Scan the QR code from your PC and enter the provided PIN
							</StepItem>
						</ol>
					),
				},
				{
					title: "Use with VidosDemoBank",
					content: (
						<>
							<p>Now you're ready to authenticate with VidosDemoBank!</p>
							<ol className="space-y-3 mt-4">
								<StepItem number={1}>
									On your phone's EUDI wallet Home screen, tap{" "}
									<strong>Authenticate</strong>
								</StepItem>
								<StepItem number={2}>
									When the snackbar appears, select <strong>Online</strong>
								</StepItem>
								<StepItem number={3}>
									Scan the QR code displayed on VidosDemoBank
								</StepItem>
							</ol>
							<Callout variant="tip">
								Start by creating an account first, then explore sending money
								and applying for loans!
							</Callout>
						</>
					),
				},
			]}
		/>
	);
}
