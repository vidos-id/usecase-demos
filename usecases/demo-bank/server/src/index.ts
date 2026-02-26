import { app } from "./app";
import { validateHealthStartup } from "./startup";

export { app };

// Run startup validation
validateHealthStartup();

export default {
	port: 53913,
	fetch: app.fetch,
};
