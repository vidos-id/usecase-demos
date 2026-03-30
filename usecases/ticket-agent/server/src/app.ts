import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { bookingsRouter } from "./routes/bookings";
import { delegationRouter } from "./routes/delegation";
import { eventsRouter } from "./routes/events";
import { healthRouter } from "./routes/health";
import { identityRouter } from "./routes/identity";
import { issuerRouter } from "./routes/issuer";
import { meRouter } from "./routes/me";
import { signinRouter } from "./routes/signin";
import { signupRouter } from "./routes/signup";

export const app = new Hono()
	.use(cors())
	.use(compress())
	.get("/.well-known/openid-credential-issuer", (c) =>
		c.redirect("/api/issuer/.well-known/openid-credential-issuer", 307),
	)
	.route("/health", healthRouter)
	.route("/api/signup", signupRouter)
	.route("/api/signin", signinRouter)
	.route("/api/identity", identityRouter)
	.route("/api/delegation", delegationRouter)
	.route("/api/events", eventsRouter)
	.route("/api/bookings", bookingsRouter)
	.route("/api/issuer", issuerRouter)
	.route("/api/me", meRouter);
