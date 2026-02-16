import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { adminRouter } from "./routes/admin";
import { callbackRouter } from "./routes/callback";
import { loanRouter } from "./routes/loan";
import { paymentRouter } from "./routes/payment";
import { profileUpdateRouter } from "./routes/profile-update";
import { sessionRouter } from "./routes/session";
import { signinRouter } from "./routes/signin";
import { signupRouter } from "./routes/signup";
import { usersMeRouter } from "./routes/users-me";
import { vidosAuthorizerHealthCheck } from "./services/vidos";

export const app = new Hono()
	.use(cors())
	.use(compress())
	.route("/api/signup", signupRouter)
	.route("/api/signin", signinRouter)
	.route("/api/payment", paymentRouter)
	.route("/api/loan", loanRouter)
	.route("/api/profile/update", profileUpdateRouter)
	.route("/api/callback", callbackRouter)
	.route("/api/session", sessionRouter)
	.route("/api/users/me", usersMeRouter)
	.route("/api/admin", adminRouter);

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
