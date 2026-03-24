import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { handleApiRequest } from "@/api/router";
import { createServer } from "@/server";
import { ensureWidgetBuilt, getBuiltWidgetHtml } from "@/ui/widget-build";
import {
	VERIFICATION_WIDGET_MIME_TYPE,
	VERIFICATION_WIDGET_URI,
	getWidgetCsp,
	getWidgetDomain,
} from "@/ui/widget-config";
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
	logDebug("http", "incoming MCP request", {
		method: request.method,
		path: new URL(request.url).pathname,
		protocolVersion: request.headers.get("mcp-protocol-version"),
	});

	// Stateless: serve the verification widget resource without creating a server instance.
	// Claude's backend fetches embedded resources as bare POST requests without a session.
	if (request.method === "POST") {
		let body: unknown;
		try {
			body = await request.clone().json();
		} catch {
			body = undefined;
		}

		if (
			body !== null &&
			typeof body === "object" &&
			(body as Record<string, unknown>).method === "resources/read"
		) {
			const params = (body as Record<string, unknown>).params as
				| Record<string, unknown>
				| undefined;
			const uri = params?.uri as string | undefined;
			const requestId = (body as Record<string, unknown>).id ?? null;
			if (uri === VERIFICATION_WIDGET_URI) {
				logDebug("http", "serving widget resource", { uri, requestId });
				const widgetHtml = await getBuiltWidgetHtml();
				const widgetDomain = getWidgetDomain();
				const widgetCsp = getWidgetCsp();
				return Response.json({
					jsonrpc: "2.0",
					id: requestId,
					result: {
						contents: [
							{
								uri,
								mimeType: VERIFICATION_WIDGET_MIME_TYPE,
								text: widgetHtml,
								_meta: {
									ui: {
										prefersBorder: true,
										...(widgetDomain ? { domain: widgetDomain } : {}),
										csp: widgetCsp,
									},
								},
							},
						],
					},
				});
			}
		}
	}

	// Stateless mode: each request gets a fresh server+transport, no session tracking.
	const server = createServer();
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	});
	await server.connect(transport);
	const response = await transport.handleRequest(request);
	await server.close();
	return response;
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
				return new Response(null, { status: 204 });
			}

			// RFC 9728: OAuth 2.0 Protected Resource Metadata
			if (
				url.pathname === "/.well-known/oauth-protected-resource" ||
				url.pathname === `/.well-known/oauth-protected-resource${mcpPath}`
			) {
				const baseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`;
				return Response.json(
					{ resource: baseUrl },
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
					return Response.json(
						{ success: false, message: "Internal server error" },
						{ status: 500 },
					);
				}
			}

			if (url.pathname === mcpPath) {
				try {
					return withMcpCors(await handleMcpRequest(request));
				} catch (error) {
					console.error("Failed to handle MCP request:", error);
					return withMcpCors(
						Response.json(
							{
								jsonrpc: "2.0",
								error: { code: -32603, message: "Internal server error" },
								id: null,
							},
							{ status: 500 },
						),
					);
				}
			}

			if (url.pathname === "/") {
				return Response.json(
					{ name: "mcp-wine-agent", status: "ok", apiPath: "/api", mcpPath },
					{ status: 200 },
				);
			}

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
