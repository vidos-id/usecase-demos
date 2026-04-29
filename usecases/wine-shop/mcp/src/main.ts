import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
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

async function createStatelessTransport(): Promise<WebStandardStreamableHTTPServerTransport> {
	const server = createServer();
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	});
	transport.onerror = (error: Error) => {
		logDebug("transport", "transport error", { error: error.message });
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
	logDebug("http", "incoming MCP request", {
		method: request.method,
		path: new URL(request.url).pathname,
		protocolVersion: request.headers.get("mcp-protocol-version"),
	});

	if (request.method === "POST") {
		const body = await getRequestBody(request);
		logDebug("http", "received POST body", body);

		// Notifications have no `id` field — treat as fire-and-forget
		if (body !== null && typeof body === "object" && !("id" in (body as object))) {
			logDebug("http", "accepted notification", body);
			return new Response(null, { status: 202 });
		}

		// Serve the verification widget resource without a full server round-trip.
		// Claude's backend fetches embedded resources in a separate request.
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
				logDebug("http", "serving static resource", { uri, requestId });
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

		logDebug("http", "handling stateless POST");
		const transport = await createStatelessTransport();
		return transport.handleRequest(request);
	}

	if (request.method === "GET" || request.method === "DELETE") {
		// Stateless mode: no persistent sessions, so GET/DELETE are not applicable
		return new Response("Session not found", { status: 404 });
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
				return new Response(null, { status: 204, headers: MCP_CORS_HEADERS });
			}

			if (url.pathname === "/health") {
				return new Response(null, { status: 204 });
			}

			if (
				url.pathname === "/.well-known/oauth-protected-resource" ||
				url.pathname === `/.well-known/oauth-protected-resource${mcpPath}`
			) {
				const baseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`;
				return Response.json(
					{ resource: baseUrl },
					{ headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" } },
				);
			}

			if (url.pathname.startsWith("/api/")) {
				if (request.method === "OPTIONS") {
					return new Response(null, { status: 204, headers: MCP_CORS_HEADERS });
				}
				try {
					const apiResponse = await handleApiRequest(request);
					return withMcpCors(apiResponse);
				} catch (error) {
					console.error("Failed to handle API request:", error);
					return withMcpCors(
						Response.json({ success: false, message: "Internal server error" }, { status: 500 }),
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
