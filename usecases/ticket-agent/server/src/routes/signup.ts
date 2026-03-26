import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { signupRequestSchema } from "ticket-agent-shared/types/users";
import { createSession } from "../stores/sessions";
import { createUser, getUserByUsername } from "../stores/users";

export const signupRouter = new Hono().post(
	"/",
	zValidator("json", signupRequestSchema),
	async (c) => {
		const { username, password } = c.req.valid("json");

		const existing = getUserByUsername(username);
		if (existing) {
			return c.json({ error: "Username already taken" }, 409);
		}

		const passwordHash = await Bun.password.hash(password);

		const user = createUser({
			id: crypto.randomUUID(),
			username,
			passwordHash,
		});

		const session = createSession(user.id);

		return c.json({
			sessionId: session.id,
			user: {
				id: user.id,
				username: user.username,
				identityVerified: user.identityVerified,
				givenName: user.givenName,
				familyName: user.familyName,
			},
		});
	},
);
