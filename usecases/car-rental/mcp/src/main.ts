import { randomUUID } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { handleApiRequest } from "@/api/router";
import { createServer } from "@/server";
import { ensureWidgetBuilt } from "@/ui/widget-build";

const port = Number(process.env.PORT ?? 30124);
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

async function createSessionTransport() {
	let transport: WebStandardStreamableHTTPServerTransport;
	const server = createServer();
	transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: () => randomUUID(),
		enableJsonResponse: true,
		onsessioninitialized: (sessionId) => {
			sessions.set(sessionId, { server, transport });
		},
	});
	transport.onclose = () => {
		if (transport.sessionId) {
			sessions.delete(transport.sessionId);
		}
		void server.close();
	};
	await server.connect(transport);
	return transport;
}

async function getRequestBody(request: Request) {
	try {
		return await request.clone().json();
	} catch {
		return undefined;
	}
}

async function handleMcpRequest(request: Request) {
	const sessionId = request.headers.get("mcp-session-id");

	if (request.method === "POST") {
		if (sessionId) {
			const existing = sessions.get(sessionId);
			if (!existing) {
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
			return existing.transport.handleRequest(request);
		}

		const body = await getRequestBody(request);
		if (!isInitializeRequest(body)) {
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

		const transport = await createSessionTransport();
		return transport.handleRequest(request);
	}

	if (request.method === "GET" || request.method === "DELETE") {
		if (!sessionId) {
			return new Response("Missing session ID", { status: 400 });
		}
		const existing = sessions.get(sessionId);
		if (!existing) {
			return new Response("Invalid session ID", { status: 404 });
		}
		return existing.transport.handleRequest(request);
	}

	return Response.json(
		{
			jsonrpc: "2.0",
			error: { code: -32000, message: "Method not allowed." },
			id: null,
		},
		{ status: 405 },
	);
}

function withMcpCors(response: Response) {
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
	await ensureWidgetBuilt();
	const app = Bun.serve({
		port,
		idleTimeout: 255,
		async fetch(request) {
			const url = new URL(request.url);
			if (url.pathname === mcpPath && request.method === "OPTIONS") {
				return new Response(null, { status: 204, headers: MCP_CORS_HEADERS });
			}
			if (url.pathname.startsWith("/api/")) {
				try {
					return await handleApiRequest(request);
				} catch (error) {
					console.error("Failed to handle API request:", error);
					return Response.json(
						{
							success: false,
							message: "Internal server error",
						},
						{ status: 500 },
					);
				}
			}
			if (url.pathname === "/health") {
				return new Response(null, { status: 204 });
			}
			if (url.pathname === mcpPath) {
				return withMcpCors(await handleMcpRequest(request));
			}
			return Response.json(
				{
					name: "mcp-car-rental-agent",
					status: "ok",
					apiPath: "/api",
					mcpPath,
				},
				{ status: 200 },
			);
		},
	});

	console.error(
		`MCP Car Rental Agent server running at http://localhost:${app.port}${mcpPath}`,
	);
}

startServer().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});
