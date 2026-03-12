import { randomUUID } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "@/server";
import { logDebug } from "@/utils/debug";

const port = Number(process.env.PORT ?? 30123);
const mcpPath = process.env.MCP_PATH ?? "/mcp";

type SessionContext = {
	server: ReturnType<typeof createServer>;
	transport: WebStandardStreamableHTTPServerTransport;
};

const sessions = new Map<string, SessionContext>();

async function createSessionTransport(): Promise<WebStandardStreamableHTTPServerTransport> {
	let transport: WebStandardStreamableHTTPServerTransport;
	const server = createServer();

	transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: () => randomUUID(),
		enableJsonResponse: true,
		onsessioninitialized: (sessionId) => {
			logDebug("transport", "session initialized", { sessionId });
			sessions.set(sessionId, {
				server,
				transport,
			});
		},
	});

	transport.onerror = (error) => {
		logDebug("transport", "transport error", {
			sessionId: transport.sessionId,
			error: error.message,
		});
	};
	transport.onclose = () => {
		logDebug("transport", "session closed", { sessionId: transport.sessionId });
		if (transport.sessionId) {
			sessions.delete(transport.sessionId);
		}
		void server.close();
	};
	await server.connect(transport);

	return transport;
}

async function getRequestBody(request: Request): Promise<unknown> {
	try {
		return await request.clone().json();
	} catch {
		return undefined;
	}
}

async function handleMcpRequest(request: Request): Promise<Response> {
	const sessionId = request.headers.get("mcp-session-id");
	logDebug("http", "incoming MCP request", {
		method: request.method,
		path: new URL(request.url).pathname,
		sessionId,
		protocolVersion: request.headers.get("mcp-protocol-version"),
	});

	if (request.method === "POST") {
		if (sessionId) {
			const existing = sessions.get(sessionId);
			if (!existing) {
				logDebug("http", "request used invalid session", { sessionId });
				return Response.json(
					{
						jsonrpc: "2.0",
						error: {
							code: -32000,
							message: "Bad Request: No valid session ID provided",
						},
						id: null,
					},
					{ status: 400 },
				);
			}

			logDebug("http", "routing POST to existing session", { sessionId });
			return existing.transport.handleRequest(request);
		}

		const body = await getRequestBody(request);
		logDebug("http", "received POST body", body);
		if (!isInitializeRequest(body)) {
			logDebug("http", "rejected POST without initialize", body);
			return Response.json(
				{
					jsonrpc: "2.0",
					error: {
						code: -32000,
						message: "Bad Request: Initialization required",
					},
					id: null,
				},
				{ status: 400 },
			);
		}

		logDebug("http", "creating new MCP session transport");
		const transport = await createSessionTransport();
		return transport.handleRequest(request);
	}

	if (request.method === "GET" || request.method === "DELETE") {
		if (!sessionId) {
			logDebug("http", "missing session for non-POST request", {
				method: request.method,
			});
			return new Response("Missing session ID", { status: 400 });
		}

		const existing = sessions.get(sessionId);
		if (!existing) {
			logDebug("http", "invalid session for non-POST request", {
				sessionId,
				method: request.method,
			});
			return new Response("Invalid session ID", { status: 404 });
		}

		logDebug("http", "routing non-POST to existing session", {
			sessionId,
			method: request.method,
		});
		return existing.transport.handleRequest(request);
	}

	logDebug("http", "rejected unsupported method", { method: request.method });
	return Response.json(
		{
			jsonrpc: "2.0",
			error: {
				code: -32000,
				message: "Method not allowed.",
			},
			id: null,
		},
		{ status: 405 },
	);
}

async function startServer() {
	logDebug("startup", "starting MCP Wine Agent server", { port, mcpPath });
	const app = Bun.serve({
		port,
		async fetch(request) {
			const url = new URL(request.url);

			if (url.pathname === "/health") {
				logDebug("http", "health check", { method: request.method });
				return new Response(null, { status: 204 });
			}

			if (url.pathname === mcpPath) {
				try {
					return await handleMcpRequest(request);
				} catch (error) {
					console.error("Failed to handle MCP request:", error);
					logDebug("http", "unhandled MCP request error", {
						error: error instanceof Error ? error.message : String(error),
					});
					return Response.json(
						{
							jsonrpc: "2.0",
							error: {
								code: -32603,
								message: "Internal server error",
							},
							id: null,
						},
						{ status: 500 },
					);
				}
			}

			logDebug("http", "non-MCP request", {
				path: url.pathname,
				method: request.method,
			});
			return Response.json(
				{
					name: "mcp-wine-agent",
					status: "ok",
					mcpPath,
				},
				{ status: 200 },
			);
		},
	});

	console.error(
		`MCP Wine Agent server running at http://localhost:${app.port}${mcpPath}`,
	);
}

startServer().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});
