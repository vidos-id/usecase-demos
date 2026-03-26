import { app } from "./app";
import { env } from "./env";
import { initializeIssuer } from "./services/issuer";

export { app };

await initializeIssuer();

export default {
	port: env.PORT,
	fetch: app.fetch,
};

console.info(`[Server] Ticket agent server starting on port ${env.PORT}`);
