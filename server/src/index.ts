import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { resetResponseSchema } from "shared/api/admin";
import {
	deleteSessionResponseSchema,
	sessionResponseSchema,
} from "shared/api/session";
import { userProfileResponseSchema } from "shared/api/users-me";
import { helloRouter } from "./routes/hello";
import { loanRouter } from "./routes/loan";
import { otherRouter } from "./routes/other";
import { paymentRouter } from "./routes/payment";
import { profileUpdateRouter } from "./routes/profile-update";
import { signinRouter } from "./routes/signin";
import { signupRouter } from "./routes/signup";
import { vidosAuthorizerHealthCheck } from "./services/vidos";

import { deleteSession, getSessionById } from "./stores/sessions";
import { deleteUser, getUserById } from "./stores/users";

export const app = new Hono()
	.use(cors())
	.use(compress())
	.get("/", (c) => {
		return c.text("Hello Hono!");
	})
	.route("/hello", helloRouter)
	.route("/other", otherRouter)
	.route("/api/signup", signupRouter)
	.route("/api/signin", signinRouter)
	.route("/api/payment", paymentRouter)
	.route("/api/loan", loanRouter)
	.route("/api/profile/update", profileUpdateRouter)
	.get("/api/session", (c) => {
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
	.get("/api/users/me", (c) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const sessionId = authHeader.slice(7);
		const session = getSessionById(sessionId);

		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const user = getUserById(session.userId);
		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const response = userProfileResponseSchema.parse({
			id: user.id,
			familyName: user.familyName,
			givenName: user.givenName,
			birthDate: user.birthDate,
			nationality: user.nationality,
			email: user.email,
			address: user.address,
			portrait: user.portrait,
			balance: user.balance,
			pendingLoansTotal: user.pendingLoansTotal,
			activity: user.activity,
		});
		return c.json(response);
	})
	.delete("/api/session", (c) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const sessionId = authHeader.slice(7);
		deleteSession(sessionId);

		const response = deleteSessionResponseSchema.parse({ success: true });
		return c.json(response);
	})
	.delete("/api/admin/reset", (c) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const sessionId = authHeader.slice(7);
		const session = getSessionById(sessionId);

		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Delete user (cascades to sessions via FK constraint)
		deleteUser(session.userId);

		const response = resetResponseSchema.parse({
			success: true,
			message: "Your demo data has been reset",
		});
		return c.json(response);
	});

Promise.resolve()
	.then(vidosAuthorizerHealthCheck)
	.then(
		(healthy) => {
			console.log(
				`Vidos Authorizer Health Check: ${healthy ? "Healthy" : "Unhealthy"}`,
			);
		},
		(error) => {
			console.error("Error during Vidos Authorizer Health Check:", error);
		},
	);

export default app;
