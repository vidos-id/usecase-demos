import { app } from "./app";
import { validateHealthStartup } from "./startup";

export { app };

// Run startup validation
validateHealthStartup();

export default app;
