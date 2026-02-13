import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { runMigrations } from "./db/client";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { loanRouter } from "./routes/loan";
import { profileRouter } from "./routes/profile";
import { paymentRouter } from "./routes/payment";
import { vidosAuthorizerHealthCheck } from "./services/vidos";

runMigrations();

export const app = new Hono()
.use(cors())
.use(compress())
.get("/", (c) => c.text("Hello Hono!"))
.route("/api/auth", authRouter)
.route("/api/profile", profileRouter)
.route("/api/payment", paymentRouter)
.route("/api/loan", loanRouter)
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
