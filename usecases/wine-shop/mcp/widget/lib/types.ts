import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
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
