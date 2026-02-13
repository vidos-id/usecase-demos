import { Fingerprint, Shield, Smartphone } from "lucide-react";
import { FeatureCard } from "./feature-card";

/**
 * Section displaying the three main feature cards explaining PID, selective disclosure, and eIDAS 2.0.
 */
export function FeaturesSection() {
	return (
		<section className="py-16 border-t border-border/40 bg-muted/20">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid sm:grid-cols-3 gap-8">
					<FeatureCard
						icon={<Fingerprint className="h-5 w-5" />}
						title="What is PID?"
						description="Person Identification Data (PID) is the core credential in EUDI Wallets. Government-verified attributes like name, birth date, and nationality — cryptographically signed per EU standards (ISO 18013-5, SD-JWT VC)."
					/>
					<FeatureCard
						icon={<Smartphone className="h-5 w-5" />}
						title="Selective Disclosure"
						description="Share only what's needed. Prove you're over 18 without revealing your birth date. Your credentials stay on-device — no central database, full GDPR compliance."
					/>
					<FeatureCard
						icon={<Shield className="h-5 w-5" />}
						title="eIDAS 2.0 Ready"
						description="By Dec 2027, banks must accept EUDI Wallet credentials for Strong Customer Authentication (SCA). This demo shows how PID-based identification streamlines KYC and payments."
					/>
				</div>
			</div>
		</section>
	);
}
