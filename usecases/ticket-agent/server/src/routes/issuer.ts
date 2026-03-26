import { Hono } from "hono";
import { getIssuerJwks, getIssuerMetadata } from "../services/issuer";

export const issuerRouter = new Hono()
	.get("/jwks", (c) => {
		const jwks = getIssuerJwks();
		return c.json(jwks);
	})
	.get("/metadata", (c) => {
		const metadata = getIssuerMetadata();
		return c.json(metadata);
	});
