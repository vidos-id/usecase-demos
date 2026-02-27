import { ConfirmationCredentialHighlights } from "@/components/confirmation/confirmation-credential-highlights";
import { buildCredentialHighlights } from "@/domain/booking/booking-confirmation";
import type { NormalizedDisclosedClaims } from "@/domain/verification/verification-schemas";

type Props = {
	disclosedClaims: NormalizedDisclosedClaims | null;
};

export function VerificationDisclosedClaimsPanel({ disclosedClaims }: Props) {
	if (!disclosedClaims) return null;

	const hasMdl = Object.values(disclosedClaims.mdl).some(Boolean);
	if (!hasMdl) {
		return null;
	}

	const highlights = buildCredentialHighlights(disclosedClaims);

	return (
		<ConfirmationCredentialHighlights
			highlights={highlights}
			title="Presented mDL Attributes"
			description="Attributes presented from the wallet during verification."
		/>
	);
}
