import { ShieldCheck, Wallet } from "lucide-react";
import { QrCode as SharedQrCode } from "vidos-web/qr-code";
import { Card, CardContent } from "@/components/ui/card";
import type { VerificationLifecycleState } from "@/domain/verification/verification-schemas";

type Props = {
	lifecycle: VerificationLifecycleState;
	requestId: string | null;
	authorizationUrl: string | null;
};

function QrSpinner() {
	return (
		<svg
			className="size-10 animate-spin"
			viewBox="0 0 48 48"
			fill="none"
			aria-hidden="true"
		>
			<circle
				cx="24"
				cy="24"
				r="20"
				stroke="currentColor"
				strokeWidth="3"
				strokeOpacity="0.12"
			/>
			<path
				d="M24 4a20 20 0 0 1 20 20"
				stroke="var(--primary)"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function VerificationQrPanel({
	lifecycle,
	requestId,
	authorizationUrl,
}: Props) {
	const isActive =
		lifecycle === "created" ||
		lifecycle === "pending_wallet" ||
		lifecycle === "processing";

	if (!isActive) return null;
	const statusLabel =
		lifecycle === "pending_wallet"
			? "Scan this QR code with your EU Digital Identity Wallet and approve the mDL disclosure to share your driving privileges and licence details."
			: lifecycle === "processing"
				? "mDL presented. Verifying your driving privileges and licence validity..."
				: "Preparing authorization request...";

	return (
		<Card className="mb-5 border-border/60">
			<CardContent className="p-6">
				<div className="mb-4 flex items-center gap-2">
					<ShieldCheck className="size-5" style={{ color: "var(--primary)" }} />
					<h3 className="font-heading text-base font-bold">
						EU Digital Identity Wallet
					</h3>
				</div>

				<p className="mb-5 text-sm text-muted-foreground">{statusLabel}</p>

				<div className="mx-auto flex size-60 items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/30">
					{authorizationUrl ? (
						<div className="relative flex size-56 items-center justify-center">
							<SharedQrCode
								value={authorizationUrl}
								size={224}
								className="size-56 rounded-lg bg-white p-2"
								color="#0b5f63"
							/>
						</div>
					) : (
						<div className="flex flex-col items-center gap-2">
							<QrSpinner />
							<Wallet className="size-6 text-muted-foreground/30" />
							<p className="text-xs text-muted-foreground/50">
								{requestId
									? `req: ${requestId.slice(0, 8)}...`
									: "Preparing verifier..."}
							</p>
							<p className="text-xs text-muted-foreground/30">mDL · mso_mdoc</p>
						</div>
					)}
				</div>

				{authorizationUrl && (
					<div className="mt-4 text-center">
						<a
							href={authorizationUrl}
							target="_blank"
							rel="noreferrer"
							className="text-xs font-medium text-primary underline underline-offset-2"
						>
							Open wallet authorization link
						</a>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
