import { Hono } from "hono";
import {
	deleteSessionResponseSchema,
	sessionResponseSchema,
} from "demo-bank-shared/api/session";
import { deleteSession, getSessionById } from "../stores/sessions";

export const sessionRouter = new Hono()
	.get("/", (c) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			const response = sessionResponseSchema.parse({
				authenticated: false,
			});
			return c.json(response);
		}

		const sessionId = authHeader.slice(7);
		const session = getSessionById(sessionId);

		if (!session) {
			const response = sessionResponseSchema.parse({
				authenticated: false,
			});
			return c.json(response);
		}

		const response = sessionResponseSchema.parse({
			authenticated: true,
			userId: session.userId,
			mode: session.mode,
		});
		return c.json(response);
	})
	.delete("/", (c) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const sessionId = authHeader.slice(7);
		deleteSession(sessionId);

		const response = deleteSessionResponseSchema.parse({ success: true });
		return c.json(response);
	});
