import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { adminRouter } from "./routes/admin";
import { callbackRouter } from "./routes/callback";
import { debugRouter } from "./routes/debug";
import { healthRouter } from "./routes/health";
import { loanRouter } from "./routes/loan";
import { paymentRouter } from "./routes/payment";
import { profileUpdateRouter } from "./routes/profile-update";
import { sessionRouter } from "./routes/session";
import { signinRouter } from "./routes/signin";
import { signupRouter } from "./routes/signup";
import { usersMeRouter } from "./routes/users-me";

export const app = new Hono()
	.use(cors())
	.use(compress())
	.route("/health", healthRouter)
	.route("/api/signup", signupRouter)
	.route("/api/signin", signinRouter)
	.route("/api/payment", paymentRouter)
	.route("/api/loan", loanRouter)
	.route("/api/profile/update", profileUpdateRouter)
	.route("/api/callback", callbackRouter)
	.route("/api/debug", debugRouter)
	.route("/api/session", sessionRouter)
	.route("/api/users/me", usersMeRouter)
	.route("/api/admin", adminRouter);
