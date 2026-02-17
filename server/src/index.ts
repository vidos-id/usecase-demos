import { app } from "./app";
import { vidosAuthorizerHealthCheck } from "./services/vidos";

export { app };

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
