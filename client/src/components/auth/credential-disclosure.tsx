import { FileText, ShieldCheck } from "lucide-react";
import { CLAIM_LABELS } from "shared/lib/claims";
import { Card, CardContent } from "@/components/ui/card";

interface CredentialDisclosureProps {
	requestedClaims: string[];
	purpose: string;
}

export function CredentialDisclosure({
	requestedClaims,
	purpose,
}: CredentialDisclosureProps) {
	return (
		<div className="space-y-4">
			{/* Purpose section */}
			<div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
				<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
					<ShieldCheck className="w-5 h-5 text-primary" />
				</div>
				<div className="flex-1 min-w-0">
					<div className="text-xs uppercase tracking-wider text-muted-foreground font-mono mb-1">
						Purpose
					</div>
					<div className="font-medium">{purpose}</div>
				</div>
			</div>

			{/* Requested credentials */}
			<Card>
				<CardContent>
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<FileText className="w-4 h-4 text-muted-foreground" />
							<div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
								Requested Attributes
							</div>
						</div>
						<div className="text-xs text-muted-foreground font-mono">
							SD-JWT / mDoc
						</div>
					</div>

					<ul className="grid grid-cols-2 gap-x-4 gap-y-2">
						{requestedClaims.map((claim) => (
							<li key={claim} className="flex items-center gap-2">
								<div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
								<span className="text-sm truncate">
									{CLAIM_LABELS[claim] || claim}
								</span>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
