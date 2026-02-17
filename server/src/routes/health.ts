import { Hono } from "hono";
import { vidosAuthorizerHealthCheck } from "../services/vidos";

export const healthRouter = new Hono().get("/", async (c) => {
	const healthy = await vidosAuthorizerHealthCheck();
	if (!healthy) {
		return c.json({ status: "unhealthy" }, 503);
	}
	return c.json({ status: "healthy" }, 200);
});
