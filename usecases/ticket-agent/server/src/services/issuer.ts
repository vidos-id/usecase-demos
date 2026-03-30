import {
	type AccessTokenRecord,
	type CredentialOffer,
	type CredentialRequest,
	credentialRequestSchema,
	DemoIssuer,
	generateIssuerTrustMaterial,
	IssuerError,
	jwkSchema,
	type NonceRecord,
	type PreAuthorizedGrantRecord,
	serializeCredentialOfferUri,
	signingAlgSchema,
	tokenRequestSchema,
} from "@vidos-id/issuer";
import { DELEGATION_VCT } from "ticket-agent-shared/types/delegation";
import { z } from "zod";
import { env } from "../env";
import {
	getDelegationSessionByAccessToken,
	getDelegationSessionById,
	getDelegationSessionByPreAuthorizedCode,
	isDelegationSessionRevoked,
	markDelegationCredentialReceived,
	markDelegationOfferUsed,
	updateDelegationSessionNonce,
} from "../stores/delegation-sessions";
import {
	getIssuerStateRecord,
	upsertIssuerState,
} from "../stores/issuer-state";

const ISSUER_NOT_CONFIGURED_ERROR =
	"Issuer service not configured: install and wire up @vidos-id/issuer.";
const CREDENTIAL_CONFIGURATION_ID = "agent_delegation";

const storedTrustMaterialSchema = z
	.object({
		alg: signingAlgSchema,
		kid: z.string().min(1),
		privateJwk: jwkSchema,
		publicJwk: jwkSchema,
		jwks: z
			.object({
				keys: z.array(jwkSchema).min(1),
			})
			.passthrough(),
	})
	.passthrough();

type StoredTrustMaterial = z.infer<typeof storedTrustMaterialSchema>;

let trustMaterial: StoredTrustMaterial | null = null;
let issuer: DemoIssuer | null = null;

function getIssuerPublicUrl(): string {
	return env.ISSUER_PUBLIC_URL ?? `http://localhost:${env.PORT}`;
}

function createDemoIssuer(trust: StoredTrustMaterial): DemoIssuer {
	const issuerPublicUrl = getIssuerPublicUrl();

	return new DemoIssuer({
		issuer: issuerPublicUrl,
		signingKey: {
			alg: trust.alg,
			privateJwk: trust.privateJwk,
			publicJwk: trust.publicJwk,
		},
		credentialConfigurationsSupported: {
			[CREDENTIAL_CONFIGURATION_ID]: {
				format: "dc+sd-jwt",
				vct: DELEGATION_VCT,
			},
		},
		endpoints: {
			token: new URL("/api/issuer/token", issuerPublicUrl).toString(),
			credential: new URL("/api/issuer/credential", issuerPublicUrl).toString(),
			nonce: new URL("/api/issuer/nonce", issuerPublicUrl).toString(),
		},
	});
}

function requireIssuer(): DemoIssuer {
	if (!issuer) {
		throw new Error(ISSUER_NOT_CONFIGURED_ERROR);
	}

	return issuer;
}

function toUnixTimestamp(iso8601: string): number {
	return Math.floor(new Date(iso8601).getTime() / 1000);
}

export async function initializeIssuer(): Promise<void> {
	const persistedMaterial = storedTrustMaterialSchema.safeParse(
		getIssuerStateRecord()?.trustMaterial,
	);

	if (persistedMaterial.success) {
		trustMaterial = persistedMaterial.data;
		issuer = createDemoIssuer(persistedMaterial.data);
		console.info("[Issuer] Loaded trust material from DB");
		return;
	}

	const generatedTrustMaterial = await generateIssuerTrustMaterial({
		subject: "/CN=Ticket Agent Demo Issuer/O=Vidos",
	});
	trustMaterial = storedTrustMaterialSchema.parse(generatedTrustMaterial);
	issuer = createDemoIssuer(trustMaterial);
	upsertIssuerState(generatedTrustMaterial);
	console.info(
		"[Issuer] Generated trust material with @vidos-id/issuer and stored it in DB",
	);
}

export async function issueDelegationCredential(params: {
	delegationId: string;
	givenName: string;
	familyName: string;
	birthDate: string;
	scopes: string[];
	validUntil: string;
}): Promise<{
	offer: CredentialOffer;
	offerUri: string;
	preAuthorizedGrant: PreAuthorizedGrantRecord;
}> {
	const currentIssuer = requireIssuer();
	const offer = currentIssuer.createCredentialOffer({
		credential_configuration_id: CREDENTIAL_CONFIGURATION_ID,
		claims: {
			delegation_id: params.delegationId,
			given_name: params.givenName,
			family_name: params.familyName,
			birth_date: params.birthDate,
			delegation_scopes: params.scopes,
			valid_until: params.validUntil,
		},
	});

	return {
		offer,
		offerUri: serializeCredentialOfferUri(offer),
		preAuthorizedGrant: offer.preAuthorizedGrant,
	};
}

export function getIssuerJwks(): StoredTrustMaterial["jwks"] {
	if (!trustMaterial) {
		throw new Error("Issuer not initialized. Call initializeIssuer() first.");
	}

	return trustMaterial.jwks;
}

export function getIssuerMetadata() {
	return requireIssuer().getMetadata();
}

export function exchangeDelegationOfferToken(
	tokenRequestInput: Record<string, unknown>,
) {
	const currentIssuer = requireIssuer();
	const tokenRequest = tokenRequestSchema.parse(tokenRequestInput);
	const delegationSession = getDelegationSessionByPreAuthorizedCode(
		tokenRequest["pre-authorized_code"],
	);

	if (
		!delegationSession?.preAuthorizedCode ||
		!delegationSession.preAuthorizedCodeExpiresAt ||
		isDelegationSessionRevoked(delegationSession.id)
	) {
		throw new IssuerError(
			"invalid_grant",
			"Invalid or expired pre-authorized code",
		);
	}

	const preAuthorizedGrant: PreAuthorizedGrantRecord = {
		preAuthorizedCode: delegationSession.preAuthorizedCode,
		credentialConfigurationId: CREDENTIAL_CONFIGURATION_ID,
		claims:
			(delegationSession.verifiedClaims as Record<string, unknown> | null) ??
			{},
		expiresAt: toUnixTimestamp(delegationSession.preAuthorizedCodeExpiresAt),
		used: delegationSession.preAuthorizedCodeUsedAt !== null,
	};

	const tokenResponse = currentIssuer.exchangePreAuthorizedCode({
		tokenRequest,
		preAuthorizedGrant,
	});

	markDelegationOfferUsed(delegationSession.id, {
		accessToken: tokenResponse.accessTokenRecord.accessToken,
		accessTokenExpiresAt: new Date(
			tokenResponse.accessTokenRecord.expiresAt * 1000,
		).toISOString(),
		preAuthorizedCodeUsedAt: new Date().toISOString(),
	});

	return tokenResponse;
}

export function createDelegationNonce(accessToken: string) {
	const currentIssuer = requireIssuer();
	const delegationSession = getDelegationSessionByAccessToken(accessToken);

	if (
		!delegationSession?.accessToken ||
		!delegationSession.accessTokenExpiresAt ||
		isDelegationSessionRevoked(delegationSession.id) ||
		delegationSession.accessTokenUsedAt ||
		new Date(delegationSession.accessTokenExpiresAt).getTime() <= Date.now()
	) {
		throw new IssuerError("invalid_token", "Invalid or expired access token");
	}

	const nonceResponse = currentIssuer.createNonce();
	updateDelegationSessionNonce(delegationSession.id, {
		lastNonce: nonceResponse.nonce.c_nonce,
		lastNonceExpiresAt: new Date(
			nonceResponse.nonce.expiresAt * 1000,
		).toISOString(),
	});

	return nonceResponse;
}

export async function issueDelegationCredentialFromProof(params: {
	accessToken: string;
	credentialRequestInput: Record<string, unknown>;
}) {
	const currentIssuer = requireIssuer();
	const delegationSession = getDelegationSessionByAccessToken(
		params.accessToken,
	);

	if (
		!delegationSession?.accessToken ||
		!delegationSession.accessTokenExpiresAt ||
		!delegationSession.lastNonce ||
		!delegationSession.lastNonceExpiresAt ||
		isDelegationSessionRevoked(delegationSession.id)
	) {
		throw new IssuerError("invalid_token", "Invalid or expired access token");
	}

	const credentialRequest: CredentialRequest = credentialRequestSchema.parse(
		params.credentialRequestInput,
	);
	const proofJwt = credentialRequest.proofs.jwt[0]?.jwt;
	if (!proofJwt) {
		throw new IssuerError("invalid_proof", "A proof JWT is required");
	}

	const accessTokenRecord: AccessTokenRecord = {
		accessToken: delegationSession.accessToken,
		credentialConfigurationId: CREDENTIAL_CONFIGURATION_ID,
		claims:
			(delegationSession.verifiedClaims as Record<string, unknown> | null) ??
			{},
		expiresAt: toUnixTimestamp(delegationSession.accessTokenExpiresAt),
		used: delegationSession.accessTokenUsedAt !== null,
	};
	const nonceRecord: NonceRecord = {
		c_nonce: delegationSession.lastNonce,
		expiresAt: toUnixTimestamp(delegationSession.lastNonceExpiresAt),
		used: delegationSession.lastNonceUsedAt !== null,
	};

	const proof = await currentIssuer.validateProofJwt({
		jwt: proofJwt,
		nonce: nonceRecord,
	});
	const issuedCredential = await currentIssuer.issueCredential({
		accessToken: accessTokenRecord,
		credential_configuration_id: credentialRequest.credential_configuration_id,
		proof,
	});

	markDelegationCredentialReceived(delegationSession.id, {
		holderPublicKey: jwkSchema.parse(proof.holderPublicJwk),
		accessTokenUsedAt: new Date().toISOString(),
		lastNonceUsedAt: new Date().toISOString(),
		credentialIssuedAt: new Date().toISOString(),
	});

	return issuedCredential;
}

export function getCredentialOfferByDelegationId(delegationId: string) {
	return getDelegationSessionById(delegationId)?.offer ?? null;
}
