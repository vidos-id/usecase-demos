import {
	type AccessTokenRecord,
	type CredentialOffer,
	type CredentialStatus,
	DemoIssuer,
	generateIssuerTrustMaterial,
	IssuerError,
	jwkSchema,
	type NonceRecord,
	type PreAuthorizedGrantRecord,
	type StatusListRecord,
	serializeCredentialOfferUri,
	signingAlgSchema,
	tokenRequestSchema,
} from "@vidos-id/openid4vc-issuer";
import { DELEGATION_VCT } from "ticket-agent-shared/types/delegation";
import { z } from "zod";
import { env } from "../env";
import {
	getDelegationSessionByAccessToken,
	getDelegationSessionById,
	getDelegationSessionByPreAuthorizedCode,
	getLatestDelegationSessionAwaitingCredential,
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
	"Issuer service not configured: install and wire up @vidos-id/openid4vc-issuer.";
const CREDENTIAL_CONFIGURATION_ID = "agent_delegation";
const OID4VCI_TTL_SECONDS = 300;
const STATUS_LIST_BITS = 2 as const;
const STATUS_LIST_ACTIVE = 0;
const STATUS_LIST_SUSPENDED = 1;
const STATUS_LIST_REVOKED = 2;

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

const credentialStatusSchema = z.object({
	status_list: z.object({
		idx: z.number().int().nonnegative(),
		uri: z.string().url(),
	}),
});

const storedStatusListSchema = z.object({
	uri: z.string().url(),
	bits: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(8)]),
	statuses: z.array(z.number().int().min(0).max(255)).default([]),
	ttl: z.number().int().positive().optional(),
	expiresAt: z.number().int().positive().optional(),
	aggregation_uri: z.string().min(1).optional(),
});

function isStatusListCompatible(list: StatusListRecord) {
	return list.bits === STATUS_LIST_BITS;
}

let trustMaterial: StoredTrustMaterial | null = null;
let issuer: DemoIssuer | null = null;
let statusList: StatusListRecord | null = null;

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
		grantTtlSeconds: OID4VCI_TTL_SECONDS,
		tokenTtlSeconds: OID4VCI_TTL_SECONDS,
		nonceTtlSeconds: OID4VCI_TTL_SECONDS,
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

function buildStatusListUrl(): string {
	return new URL(
		"/api/issuer/status-lists/agent-delegation",
		getIssuerPublicUrl(),
	).toString();
}

function requireStatusList(): StatusListRecord {
	if (!statusList) {
		throw new Error(
			"Issuer status list not initialized. Call initializeIssuer() first.",
		);
	}

	return statusList;
}

function persistIssuerState() {
	if (!trustMaterial) {
		throw new Error("Issuer trust material not initialized");
	}

	upsertIssuerState({
		trustMaterial,
		statusList,
	});
}

export function getDelegationCredentialStatusValue(
	credentialStatusInput: unknown,
) {
	const credentialStatus = credentialStatusSchema.parse(credentialStatusInput);
	const currentStatusList = requireStatusList();

	if (credentialStatus.status_list.uri !== currentStatusList.uri) {
		throw new Error(
			"Credential status does not belong to this issuer status list",
		);
	}

	const value = currentStatusList.statuses[credentialStatus.status_list.idx];
	if (typeof value !== "number") {
		throw new Error("Credential status index is out of bounds");
	}

	return value;
}

function toUnixTimestamp(iso8601: string): number {
	return Math.floor(new Date(iso8601).getTime() / 1000);
}

function getRemainingSeconds(expiresAtIso8601: string): number {
	return Math.max(
		0,
		toUnixTimestamp(expiresAtIso8601) -
			toUnixTimestamp(new Date().toISOString()),
	);
}

export async function initializeIssuer(): Promise<void> {
	const persistedMaterial = storedTrustMaterialSchema.safeParse(
		getIssuerStateRecord()?.trustMaterial,
	);

	if (persistedMaterial.success) {
		trustMaterial = persistedMaterial.data;
		issuer = createDemoIssuer(persistedMaterial.data);
		const persistedStatusList = storedStatusListSchema.safeParse(
			getIssuerStateRecord()?.statusList,
		);
		statusList =
			persistedStatusList.success &&
			isStatusListCompatible(persistedStatusList.data)
				? persistedStatusList.data
				: issuer.createStatusList({
						uri: buildStatusListUrl(),
						bits: STATUS_LIST_BITS,
						ttl: OID4VCI_TTL_SECONDS,
					});
		persistIssuerState();
		console.info("[Issuer] Loaded trust material from DB");
		return;
	}

	const generatedTrustMaterial = await generateIssuerTrustMaterial({
		subject: "/CN=Ticket Agent Demo Issuer/O=Vidos",
	});
	trustMaterial = storedTrustMaterialSchema.parse(generatedTrustMaterial);
	issuer = createDemoIssuer(trustMaterial);
	statusList = issuer.createStatusList({
		uri: buildStatusListUrl(),
		bits: STATUS_LIST_BITS,
		ttl: OID4VCI_TTL_SECONDS,
	});
	upsertIssuerState({
		trustMaterial: generatedTrustMaterial,
		statusList,
	});
	console.info(
		"[Issuer] Generated trust material with @vidos-id/openid4vc-issuer and stored it in DB",
	);
}

export async function issueDelegationCredential(params: {
	delegationId: string;
	agentName: string;
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
			agent_name: params.agentName,
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

export async function getStatusListToken() {
	return requireIssuer().createStatusListToken(requireStatusList());
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

	if (
		delegationSession.preAuthorizedCodeUsedAt &&
		delegationSession.accessToken &&
		delegationSession.accessTokenExpiresAt &&
		new Date(delegationSession.accessTokenExpiresAt).getTime() > Date.now()
	) {
		const accessTokenRecord: AccessTokenRecord = {
			accessToken: delegationSession.accessToken,
			credentialConfigurationId: CREDENTIAL_CONFIGURATION_ID,
			claims:
				(delegationSession.verifiedClaims as Record<string, unknown> | null) ??
				{},
			expiresAt: toUnixTimestamp(delegationSession.accessTokenExpiresAt),
			used: delegationSession.accessTokenUsedAt !== null,
		};

		return {
			access_token: delegationSession.accessToken,
			token_type: "Bearer" as const,
			expires_in: getRemainingSeconds(delegationSession.accessTokenExpiresAt),
			credential_configuration_id: CREDENTIAL_CONFIGURATION_ID,
			accessTokenRecord,
			updatedPreAuthorizedGrant: {
				...preAuthorizedGrant,
				used: true,
			},
		};
	}

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

export function createDelegationNonce(accessToken?: string) {
	const currentIssuer = requireIssuer();
	const delegationSession = accessToken
		? getDelegationSessionByAccessToken(accessToken)
		: getLatestDelegationSessionAwaitingCredential();

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
	credentialRequestInput: Record<string, unknown> & {
		credential_configuration_id: string;
		proofs?: {
			jwt: Array<{
				proof_type: "jwt";
				jwt: string;
			}>;
		};
	};
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

	const proofJwt = params.credentialRequestInput.proofs?.jwt[0]?.jwt;
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
	const credentialStatus = allocateDelegationCredentialStatus();
	const issuedCredential = await currentIssuer.issueCredential({
		accessToken: accessTokenRecord,
		credential_configuration_id:
			params.credentialRequestInput.credential_configuration_id,
		proof,
		status: credentialStatus,
	});

	try {
		markDelegationCredentialReceived(delegationSession.id, {
			holderPublicKey: jwkSchema.parse(proof.holderPublicJwk),
			credentialStatus: credentialStatusSchema.parse(credentialStatus),
			accessTokenUsedAt: new Date().toISOString(),
			lastNonceUsedAt: new Date().toISOString(),
			credentialIssuedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error(
			"[Issuer] Credential issued but delegation session update failed:",
			error,
		);
	}

	return issuedCredential;
}

function allocateDelegationCredentialStatus(): CredentialStatus {
	const currentIssuer = requireIssuer();
	const allocated = currentIssuer.allocateCredentialStatus({
		statusList: requireStatusList(),
		status: STATUS_LIST_ACTIVE,
	});
	statusList = allocated.updatedStatusList;
	persistIssuerState();
	return allocated.credentialStatus;
}

function updateDelegationCredentialStatus(
	credentialStatusInput: unknown,
	status: number,
) {
	const currentIssuer = requireIssuer();
	const credentialStatus = credentialStatusSchema.parse(credentialStatusInput);
	const currentStatusList = requireStatusList();

	if (credentialStatus.status_list.uri !== currentStatusList.uri) {
		throw new Error(
			"Credential status does not belong to this issuer status list",
		);
	}

	statusList = currentIssuer.updateCredentialStatus({
		statusList: currentStatusList,
		idx: credentialStatus.status_list.idx,
		status,
	});
	persistIssuerState();

	return statusList;
}

export function suspendDelegationCredentialStatus(
	credentialStatusInput: unknown,
) {
	return updateDelegationCredentialStatus(
		credentialStatusInput,
		STATUS_LIST_SUSPENDED,
	);
}

export function reactivateDelegationCredentialStatus(
	credentialStatusInput: unknown,
) {
	return updateDelegationCredentialStatus(
		credentialStatusInput,
		STATUS_LIST_ACTIVE,
	);
}

export function revokeDelegationCredentialStatus(
	credentialStatusInput: unknown,
) {
	return updateDelegationCredentialStatus(
		credentialStatusInput,
		STATUS_LIST_REVOKED,
	);
}

export function getCredentialOfferByDelegationId(delegationId: string) {
	return getDelegationSessionById(delegationId)?.offer ?? null;
}
