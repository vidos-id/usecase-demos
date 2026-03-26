import {
	DemoIssuer,
	generateIssuerTrustMaterial,
	type Jwk,
	jwkSchema,
	signingAlgSchema,
} from "@vidos-id/issuer";
import { DELEGATION_VCT } from "ticket-agent-shared/types/delegation";
import { z } from "zod";
import { env } from "../env";
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
	givenName: string;
	familyName: string;
	birthDate: string;
	agentPublicJwk: Record<string, unknown>;
	scopes: string[];
	validUntil: string;
}): Promise<string> {
	if (!trustMaterial || !issuer) {
		throw new Error("Issuer not initialized. Call initializeIssuer() first.");
	}

	const grant = issuer.createPreAuthorizedGrant({
		credential_configuration_id: CREDENTIAL_CONFIGURATION_ID,
		claims: {
			given_name: params.givenName,
			family_name: params.familyName,
			birth_date: params.birthDate,
			delegation_scopes: params.scopes,
			valid_until: params.validUntil,
		},
	});
	const tokenResponse = issuer.exchangePreAuthorizedCode({
		grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code",
		"pre-authorized_code": grant.preAuthorizedCode,
	});
	const issuedCredential = await issuer.issueCredential({
		access_token: tokenResponse.access_token,
		credential_configuration_id: CREDENTIAL_CONFIGURATION_ID,
		holderPublicJwk: jwkSchema.parse(params.agentPublicJwk) as Jwk,
	});

	return issuedCredential.credential;
}

export function getIssuerJwks(): StoredTrustMaterial["jwks"] {
	if (!trustMaterial) {
		throw new Error("Issuer not initialized. Call initializeIssuer() first.");
	}

	return trustMaterial.jwks;
}

export function getIssuerMetadata() {
	if (!issuer) {
		throw new Error(ISSUER_NOT_CONFIGURED_ERROR);
	}

	return issuer.getMetadata();
}
