import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { helloRouter } from "./routes/hello";
import { otherRouter } from "./routes/other";
import { signinRouter } from "./routes/signin";
import { signupRouter } from "./routes/signup";

export const app = new Hono()
	.use(cors())
	.use(compress())
	.get("/", (c) => {
		return c.text("Hello Hono!");
	})
	.route("/hello", helloRouter)
	.route("/other", otherRouter)
	.route("/api/signup", signupRouter)
	.route("/api/signin", signinRouter);

export default app;
