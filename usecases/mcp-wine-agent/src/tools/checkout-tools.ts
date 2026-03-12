import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { ToolResponse } from "@/schemas/catalog";
import type { CheckoutSession } from "@/schemas/verification";
import {
	checkVerificationStatus,
	formatCheckoutStatusMessage,
	initiateCheckout,
} from "@/services/checkout";
import {
	generateQrSvg,
	VERIFICATION_WIDGET_MIME_TYPE,
	VERIFICATION_WIDGET_URI,
} from "@/ui/verification-widget";
import { logDebug } from "@/utils/debug";

export const InitiateCheckoutInputSchema = z.object({
	cartSessionId: z.string(),
});

export const GetCheckoutStatusInputSchema = z.object({
	checkoutSessionId: z.string(),
});

function toToolResult(result: ToolResponse) {
	return {
		content: (result.content as CallToolResult["content"] | undefined) ?? [
			{ type: "text" as const, text: result.message },
		],
		structuredContent:
			typeof result.data === "object" && result.data !== null
				? (result.data as Record<string, unknown>)
				: {},
		data: result.data,
		isError: !result.success,
	};
}

function buildVerificationContent(
	message: string,
	qrSvg?: string,
): CallToolResult["content"] {
	return [
		{ type: "text", text: message },
		...(qrSvg
			? [
					{
						type: "resource" as const,
						resource: {
							uri: VERIFICATION_WIDGET_URI,
							mimeType: VERIFICATION_WIDGET_MIME_TYPE,
							text: "Verification widget ready.",
						},
					},
				]
			: []),
	];
}

export async function initiateCheckoutTool(
	args: unknown,
): Promise<ToolResponse> {
	logDebug("tool:initiate_checkout", "called", args);
	const parsed = InitiateCheckoutInputSchema.safeParse(args);
	if (!parsed.success) {
		logDebug(
			"tool:initiate_checkout",
			"input validation failed",
			parsed.error.format(),
		);
		return {
			success: false,
			message: `Invalid input: ${parsed.error.message}`,
		};
	}

	try {
		logDebug("tool:initiate_checkout", "starting checkout", {
			cartSessionId: parsed.data.cartSessionId,
		});
		const { session, requiresVerification } = await initiateCheckout(
			parsed.data.cartSessionId,
		);
		logDebug("tool:initiate_checkout", "checkout started", {
			cartSessionId: parsed.data.cartSessionId,
			checkoutSessionId: session.sessionId,
			status: session.status,
			requiresVerification,
		});

		if (requiresVerification) {
			const authUrl = session.verification?.authorizationUrl;
			const qrSvg = authUrl ? await generateQrSvg(authUrl) : undefined;
			logDebug("tool:initiate_checkout", "verification widget prepared", {
				checkoutSessionId: session.sessionId,
				hasAuthorizationUrl: Boolean(authUrl),
				hasQrSvg: Boolean(qrSvg),
			});

			const messageParts = [
				`Checkout initiated (session: ${session.sessionId}).`,
				`Cart session: ${parsed.data.cartSessionId}`,
				"",
				"This cart contains age-restricted items (wine).",
				"Age verification is required to complete the purchase.",
				"",
				"Please scan the QR code with your digital identity wallet to verify your age.",
			];

			if (authUrl) {
				messageParts.push("", `Authorization URL: ${authUrl}`);
			}

			messageParts.push(
				"",
				"Use 'get_checkout_status' to check verification progress.",
			);

			return {
				success: true,
				message: messageParts.join("\n"),
				data: {
					checkoutSessionId: session.sessionId,
					status: session.status,
					requiresVerification: true,
					widgetUri: VERIFICATION_WIDGET_URI,
					qrSvg,
					authorizeUrl: authUrl,
					authorization: session.verification
						? {
								authorizationId: session.verification.authorizationId,
								authorizeUrl: session.verification.authorizationUrl,
								expiresAt: null,
							}
						: null,
				},
				content: buildVerificationContent(messageParts.join("\n"), qrSvg),
			};
		}

		return {
			success: true,
			message:
				`Checkout initiated (session: ${session.sessionId}, cart: ${parsed.data.cartSessionId}). ` +
				"No verification required. Ready to complete.",
			data: {
				cartSessionId: parsed.data.cartSessionId,
				checkoutSessionId: session.sessionId,
				status: session.status,
				requiresVerification: false,
			},
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logDebug("tool:initiate_checkout", "checkout failed", {
			cartSessionId: parsed.data.cartSessionId,
			error: message,
		});
		return {
			success: false,
			message:
				`Failed to initiate checkout: ${message}. ` +
				"Use the exact `cartSessionId` returned by `add_to_cart` or `get_cart`.",
		};
	}
}

export function getCheckoutStatusTool(args: unknown): ToolResponse {
	logDebug("tool:get_checkout_status", "called", args);
	const parsed = GetCheckoutStatusInputSchema.safeParse(args);
	if (!parsed.success) {
		logDebug(
			"tool:get_checkout_status",
			"input validation failed",
			parsed.error.format(),
		);
		return {
			success: false,
			message: `Invalid input: ${parsed.error.message}`,
		};
	}

	try {
		const session = checkVerificationStatus(parsed.data.checkoutSessionId);
		const message = formatCheckoutStatusMessage(session);
		logDebug("tool:get_checkout_status", "status loaded", {
			checkoutSessionId: parsed.data.checkoutSessionId,
			status: session.status,
			verificationLifecycle: session.verification?.lifecycle,
		});

		return {
			success: true,
			message,
			data: buildCheckoutStatusData(session),
		};
	} catch (error) {
		logDebug("tool:get_checkout_status", "status lookup failed", {
			checkoutSessionId: parsed.data.checkoutSessionId,
			error: error instanceof Error ? error.message : String(error),
		});
		return {
			success: false,
			message: `Failed to get checkout status: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

function buildCheckoutStatusData(
	session: CheckoutSession,
): Record<string, unknown> {
	const base = {
		checkoutSessionId: session.sessionId,
		cartSessionId: session.cartSessionId,
		status: session.status,
		createdAt: session.createdAt,
		updatedAt: session.updatedAt,
	};

	if (!session.verification) {
		return base;
	}

	return {
		...base,
		verification: {
			lifecycle: session.verification.lifecycle,
			authorizationId: session.verification.authorizationId,
			authorizationUrl: session.verification.authorizationUrl,
			ageCheck: session.verification.ageCheck,
			lastError: session.verification.lastError,
			updatedAt: session.verification.updatedAt,
		},
	};
}

export function registerInitiateCheckoutTool(server: McpServer) {
	server.registerTool(
		"initiate_checkout",
		{
			description:
				"Start checkout for a cart. Requires the exact cartSessionId returned by add_to_cart or get_cart. For age-restricted products, immediately creates a Vidos authorization and returns verification-required state with authorizeUrl for QR display.",
			inputSchema: InitiateCheckoutInputSchema,
			_meta: {
				ui: {
					resourceUri: VERIFICATION_WIDGET_URI,
				},
				"ui/resourceUri": VERIFICATION_WIDGET_URI,
				"openai/outputTemplate": VERIFICATION_WIDGET_URI,
			},
		},
		async (args) => toToolResult(await initiateCheckoutTool(args)),
	);
}

export function registerGetCheckoutStatusTool(server: McpServer) {
	server.registerTool(
		"get_checkout_status",
		{
			description:
				"Get the current checkout and verification status. Poll this to check if verification is complete.",
			inputSchema: GetCheckoutStatusInputSchema,
		},
		async (args) => toToolResult(getCheckoutStatusTool(args)),
	);
}

export function registerCheckoutTools(server: McpServer) {
	registerInitiateCheckoutTool(server);
	registerGetCheckoutStatusTool(server);
}
