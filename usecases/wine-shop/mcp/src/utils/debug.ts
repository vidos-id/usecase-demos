const enabled = process.env.DEBUG_MCP_SERVER !== "0";

function safeStringify(value: unknown): string {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

export function logDebug(scope: string, message: string, data?: unknown) {
	if (!enabled) return;

	const timestamp = new Date().toISOString();
	if (data === undefined) {
		console.error(`[mcp-debug] ${timestamp} [${scope}] ${message}`);
		return;
	}

	console.error(
		`[mcp-debug] ${timestamp} [${scope}] ${message} ${safeStringify(data)}`,
	);
}
