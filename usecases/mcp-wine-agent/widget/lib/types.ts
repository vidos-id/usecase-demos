import type {
	CallToolRequestParams,
	CallToolResult,
	JSONRPCMessage,
	JSONRPCNotification,
	JSONRPCRequest,
	JSONRPCResponse,
	RequestId,
	TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import type {
	CheckoutSession,
	VerificationState,
} from "../../src/schemas/verification";

export type VerificationStatus = CheckoutSession["status"];
export type VerificationViewVerification = VerificationState | null;

export type VerificationViewData = {
	checkoutSessionId?: string;
	status?: VerificationStatus;
	qrSvg?: string;
	authorizeUrl?: string;
	authorization?: {
		authorizationId?: string | null;
		authorizeUrl?: string | null;
		expiresAt?: string | null;
	} | null;
	verification?: VerificationViewVerification;
};

export type WidgetToolResult = Pick<CallToolResult, "structuredContent"> &
	Partial<CallToolResult>;

export type WidgetToolPayload =
	| WidgetToolResult
	| VerificationViewData
	| null
	| undefined;

export type VerificationResultViewModel = {
	className: "result-success" | "result-failure";
	icon: string;
	title: string;
	detail: string;
};

export type DomElements = {
	qrCodeEl: HTMLElement;
	qrContainerEl: HTMLElement;
	statusEl: HTMLElement;
	instructionsTextEl: HTMLElement;
	instructionsSectionEl: HTMLElement;
	authorizationLinkEl: HTMLElement;
	verificationResultEl: HTMLElement;
	paymentPanelEl: HTMLElement;
	checkoutButtonEl: HTMLButtonElement;
	paymentSuccessEl: HTMLElement;
};

export type RenderViewState = {
	data: VerificationViewData;
	qrSvg: string;
	authorizeUrl: string;
	paymentCompleted: boolean;
};

export type AppState = {
	latestToolOutput: WidgetToolPayload;
	latestSessionId: string | null;
	latestQrSvg: string;
	latestAuthorizeUrl: string;
	completionNotified: boolean;
	paymentCompleted: boolean;
};

export type PendingRpcRequest = {
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
};

export type RpcRequestMessage = Pick<JSONRPCRequest, "jsonrpc"> & {
	id: RequestId;
	method: string;
	params?: unknown;
};

export type RpcNotificationMessage = Pick<JSONRPCNotification, "jsonrpc"> & {
	method: string;
	params?: unknown;
};

export type ToolCallRpcParams = Pick<
	CallToolRequestParams,
	"name" | "arguments"
>;

export type HostMessageTextContent = TextContent;

export type OpenAIHost = {
	toolOutput?: WidgetToolPayload;
	callTool?: (
		name: string,
		arguments_: Record<string, unknown>,
	) => Promise<WidgetToolPayload>;
};

export type OpenAISetGlobalsDetail = {
	globals?: {
		toolOutput?: WidgetToolPayload;
	};
};

export type JsonRpcToolResultNotification = JSONRPCNotification & {
	method: "ui/notifications/tool-result";
	params?: WidgetToolPayload;
};

declare global {
	interface Window {
		openai?: OpenAIHost;
	}

	interface WindowEventMap {
		"openai:set_globals": CustomEvent<OpenAISetGlobalsDetail>;
	}
}

export type { JSONRPCMessage };
