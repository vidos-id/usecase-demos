import { Fingerprint, Smartphone } from "lucide-react";

/**
 * Visual representation of a digital wallet card with PID credential preview.
 * Shows a stacked card design comparing traditional forms vs wallet-based identity.
 */
export function WalletCardVisual() {
	return (
		<div className="relative lg:h-[480px] flex items-center justify-center animate-slide-in-right">
			{/* Background decoration */}
			<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-3xl" />
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

			{/* Card stack visualization */}
			<div className="relative z-10 w-full max-w-sm">
				{/* Back card - Traditional form */}
				<div className="absolute top-8 left-4 right-4 bg-muted/50 rounded-2xl p-6 border border-border/40 rotate-[-3deg] opacity-60">
					<div className="space-y-3">
						<div className="h-3 w-24 bg-muted-foreground/20 rounded" />
						<div className="h-8 w-full bg-muted-foreground/10 rounded" />
						<div className="h-3 w-20 bg-muted-foreground/20 rounded" />
						<div className="h-8 w-full bg-muted-foreground/10 rounded" />
						<div className="h-3 w-28 bg-muted-foreground/20 rounded" />
						<div className="h-8 w-full bg-muted-foreground/10 rounded" />
					</div>
				</div>

				{/* Front card - Wallet */}
				<div className="relative bg-gradient-to-br from-background to-muted/30 rounded-2xl p-6 border border-border shadow-2xl shadow-primary/10 rotate-[2deg]">
					{/* Wallet header */}
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-2">
							<div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
								<Smartphone className="h-4 w-4 text-primary" />
							</div>
							<div>
								<div className="text-sm font-semibold">Digital Wallet</div>
								<div className="text-[10px] text-muted-foreground">
									Person Identification
								</div>
							</div>
						</div>
						<div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
							<div className="h-2 w-2 rounded-full bg-green-500" />
						</div>
					</div>

					{/* Credential preview */}
					<div className="space-y-3 mb-6">
						<div className="flex justify-between items-center py-2 border-b border-border/40">
							<span className="text-xs text-muted-foreground">Full Name</span>
							<span className="text-sm font-medium">Maria Garcia</span>
						</div>
						<div className="flex justify-between items-center py-2 border-b border-border/40">
							<span className="text-xs text-muted-foreground">
								Date of Birth
							</span>
							<span className="text-sm font-medium">1990-05-15</span>
						</div>
						<div className="flex justify-between items-center py-2 border-b border-border/40">
							<span className="text-xs text-muted-foreground">Nationality</span>
							<span className="text-sm font-medium">Spanish</span>
						</div>
					</div>

					{/* Action */}
					<div className="flex items-center justify-center gap-2 py-3 bg-primary/10 rounded-lg">
						<Fingerprint className="h-4 w-4 text-primary" />
						<span className="text-sm font-medium text-primary">
							Share with DemoBank
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
