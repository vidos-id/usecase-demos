/**
 * Startup validation module - runs health checks before server starts.
 * Add new checks by creating a function and adding it to the validators array.
 */

import { vidosAuthorizerHealthCheck } from "./services/vidos";

export type StartupCheck = {
	name: string;
	check: () => Promise<boolean>;
};

const validators: StartupCheck[] = [
	{
		name: "Vidos Authorizer",
		check: vidosAuthorizerHealthCheck,
	},
	// Add more startup checks here in the future
];

export async function validateHealthStartup() {
	const results: Array<{ name: string; passed: boolean; error?: string }> = [];

	for (const validator of validators) {
		try {
			const passed = await validator.check();
			if (!passed) {
				results.push({
					name: validator.name,
					passed: false,
					error: "Health check failed",
				});
			} else {
				results.push({ name: validator.name, passed: true });
			}
		} catch (error) {
			results.push({
				name: validator.name,
				passed: false,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	// Log results
	console.log("[Startup] Running validators...");
	let allPassed = true;
	for (const result of results) {
		if (result.passed) {
			console.log(`[Startup] ✓ ${result.name}`);
		} else {
			console.error(`[Startup] ✗ ${result.name}: ${result.error || "Failed"}`);
			allPassed = false;
		}
	}

	if (!allPassed) {
		console.error("[Startup] Validation failed. Server cannot start.");
		process.exit(1);
	}

	console.log("[Startup] All validators passed ✓");
}
