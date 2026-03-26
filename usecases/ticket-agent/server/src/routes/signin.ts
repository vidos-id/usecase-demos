import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { signinRequestSchema } from "ticket-agent-shared/types/users";
import { createSession } from "../stores/sessions";
import { getUserByUsername } from "../stores/users";

export const signinRouter = new Hono().post(
	"/",
	zValidator("json", signinRequestSchema),
	async (c) => {
		const { username, password } = c.req.valid("json");

		const user = getUserByUsername(username);
		if (!user) {
			return c.json({ error: "Invalid credentials" }, 401);
		}

		const passwordValid = await Bun.password.verify(
			password,
			user.passwordHash,
		);
		if (!passwordValid) {
			return c.json({ error: "Invalid credentials" }, 401);
		}

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
