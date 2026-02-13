import { Lock, Shield, Zap } from "lucide-react";

/**
 * Trust indicators showing key compliance and technology badges.
 */
export function TrustBadges() {
	return (
		<div className="flex items-center gap-6 pt-4 text-muted-foreground/70">
			<div className="flex items-center gap-1.5">
				<Shield className="h-4 w-4" />
				<span className="text-sm">eIDAS 2.0</span>
			</div>
			<div className="flex items-center gap-1.5">
				<Lock className="h-4 w-4" />
				<span className="text-sm">OID4VP</span>
			</div>
			<div className="flex items-center gap-1.5">
				<Zap className="h-4 w-4" />
				<span className="text-sm">Instant KYC</span>
			</div>
		</div>
	);
}
