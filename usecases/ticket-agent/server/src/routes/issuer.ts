import { zValidator } from "@hono/zod-validator";
import { IssuerError } from "@vidos-id/issuer";
import { type Context, Hono } from "hono";
import { z } from "zod";
import {
	createDelegationNonce,
	exchangeDelegationOfferToken,
	getIssuerJwks,
	getIssuerMetadata,
	issueDelegationCredentialFromProof,
} from "../services/issuer";

const tokenRequestBodySchema = z.object({
	grant_type: z.string(),
	"pre-authorized_code": z.string(),
	tx_code: z.string().optional(),
});

const credentialRequestBodySchema = z.object({
	format: z.literal("dc+sd-jwt").optional(),
	credential_configuration_id: z.string(),
	proofs: z.object({
		jwt: z.array(
			z.object({
				proof_type: z.literal("jwt"),
				jwt: z.string(),
			}),
		),
	}),
});

function handleIssuerError(c: Context, error: unknown) {
	if (error instanceof IssuerError) {
		const status = error.code === "invalid_token" ? 401 : 400;
		return c.json(
			{
				error: error.code,
				error_description: error.message,
			},
			status,
		);
	}

	console.error("[Issuer] Unexpected error:", error);
	return c.json({ error: "server_error" }, 500);
}

export const issuerRouter = new Hono()
	.get("/jwks", (c) => c.json(getIssuerJwks()))
	.get("/metadata", (c) => c.json(getIssuerMetadata()))
	.get("/.well-known/openid-credential-issuer", (c) =>
		c.json(getIssuerMetadata()),
	)
	.post("/token", zValidator("form", tokenRequestBodySchema), async (c) => {
		try {
			const tokenResponse = exchangeDelegationOfferToken(c.req.valid("form"));
			return c.json({
				access_token: tokenResponse.access_token,
				token_type: tokenResponse.token_type,
				expires_in: tokenResponse.expires_in,
				credential_configuration_id: tokenResponse.credential_configuration_id,
			});
		} catch (error) {
			return handleIssuerError(c, error);
		}
	})
	.post("/nonce", async (c) => {
		const accessToken = (c.req.header("Authorization") ?? "")
			.replace(/^Bearer\s+/i, "")
			.trim();

		try {
			const nonceResponse = createDelegationNonce(accessToken);
			c.header("Cache-Control", "no-store");
			return c.json({
				c_nonce: nonceResponse.c_nonce,
				c_nonce_expires_in: nonceResponse.c_nonce_expires_in,
			});
		} catch (error) {
			return handleIssuerError(c, error);
		}
	})
	.post(
		"/credential",
		zValidator("json", credentialRequestBodySchema),
		async (c) => {
			const accessToken = (c.req.header("Authorization") ?? "")
				.replace(/^Bearer\s+/i, "")
				.trim();
			if (!accessToken) {
				return c.json(
					{
						error: "invalid_token",
						error_description: "Missing Bearer access token",
					},
					401,
				);
			}

			try {
				const issuedCredential = await issueDelegationCredentialFromProof({
					accessToken,
					credentialRequestInput: c.req.valid("json"),
				});
				return c.json({
					format: issuedCredential.format,
					credential: issuedCredential.credential,
					c_nonce: issuedCredential.c_nonce,
				});
			} catch (error) {
				return handleIssuerError(c, error);
			}
		},
	);
