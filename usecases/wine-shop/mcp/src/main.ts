import { randomUUID } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { handleApiRequest } from "@/api/router";
import { createServer } from "@/server";
import { ensureWidgetBuilt } from "@/ui/widget-build";
import { logDebug } from "@/utils/debug";

const port = Number(process.env.PORT ?? 44182);
const mcpPath = process.env.MCP_PATH ?? "/mcp";

const MCP_CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"content-type, accept, mcp-session-id, mcp-protocol-version, last-event-id",
	"Access-Control-Expose-Headers": "mcp-session-id",
};

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
		onsessioninitialized: (sessionId: string) => {
			logDebug("transport", "session initialized", { sessionId });
			sessions.set(sessionId, {
				server,
				transport,
			});
		},
	});

	transport.onerror = (error: Error) => {
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

/**
 * The MCP Streamable HTTP spec requires clients to send Accept: application/json, text/event-stream.
 * Claude Desktop sends only Accept: text/event-stream, causing the SDK to return 406.
 * Normalize the Accept header to include both values before passing to the transport.
 */
function withRequiredAccept(request: Request): Request {
	const accept = request.headers.get("accept") ?? "";
	if (accept.includes("application/json") && accept.includes("text/event-stream")) {
		return request;
	}
	const parts = [accept, "application/json", "text/event-stream"].filter(Boolean);
	const headers = new Headers(request.headers);
	headers.set("accept", [...new Set(parts)].join(", "));
	return new Request(request, { headers });
}

async function handleMcpRequest(request: Request): Promise<Response> {
	request = withRequiredAccept(request);
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

function withMcpCors(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [key, value] of Object.entries(MCP_CORS_HEADERS)) {
		headers.set(key, value);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

async function startServer() {
	logDebug("startup", "starting MCP Wine Agent server", { port, mcpPath });
	await ensureWidgetBuilt();
	const app = Bun.serve({
		port,
		async fetch(request) {
			const url = new URL(request.url);

			// Log all incoming requests (except health checks) for debugging
			if (url.pathname !== "/health") {
				logDebug("http", "request", {
					method: request.method,
					path: url.pathname,
					accept: request.headers.get("accept"),
					userAgent: request.headers.get("user-agent"),
				});
			}

			if (url.pathname === mcpPath && request.method === "OPTIONS") {
				return new Response(null, {
					status: 204,
					headers: MCP_CORS_HEADERS,
				});
			}

			if (url.pathname === "/health") {
				logDebug("http", "health check", { method: request.method });
				return new Response(null, { status: 204 });
			}

			// RFC 9728: OAuth 2.0 Protected Resource Metadata
			// Required by MCP spec for client discovery. No authorization_servers = authless.
			if (
				url.pathname === "/.well-known/oauth-protected-resource" ||
				url.pathname === `/.well-known/oauth-protected-resource${mcpPath}`
			) {
				const baseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`;
				return Response.json(
					{ resource: `${baseUrl}${mcpPath}` },
					{
						headers: {
							"Access-Control-Allow-Origin": "*",
							"Cache-Control": "public, max-age=3600",
						},
					},
				);
			}

			if (url.pathname.startsWith("/api/")) {
				try {
					return await handleApiRequest(request);
				} catch (error) {
					console.error("Failed to handle API request:", error);
					logDebug("http", "unhandled API request error", {
						path: url.pathname,
						error: error instanceof Error ? error.message : String(error),
					});
					return Response.json(
						{
							success: false,
							message: "Internal server error",
						},
						{ status: 500 },
					);
				}
			}

			if (url.pathname === mcpPath) {
				try {
					return withMcpCors(await handleMcpRequest(request));
				} catch (error) {
					console.error("Failed to handle MCP request:", error);
					logDebug("http", "unhandled MCP request error", {
						error: error instanceof Error ? error.message : String(error),
					});
					return withMcpCors(
						Response.json(
							{
								jsonrpc: "2.0",
								error: {
									code: -32603,
									message: "Internal server error",
								},
								id: null,
							},
							{ status: 500 },
						),
					);
				}
			}

			if (url.pathname === "/") {
				return Response.json(
					{
						name: "mcp-wine-agent",
						status: "ok",
						apiPath: "/api",
						mcpPath,
					},
					{ status: 200 },
				);
			}

			logDebug("http", "not found", {
				path: url.pathname,
				method: request.method,
			});
			return new Response(null, { status: 404 });
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
