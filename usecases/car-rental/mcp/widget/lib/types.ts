import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { BookingSnapshot } from "../../src/schemas/booking";

export type RentalWidgetData = {
	booking?: BookingSnapshot;
	widgetUri?: string;
	qrCodeDataUrl?: string;
};

export type WidgetToolResult = Pick<CallToolResult, "structuredContent"> &
	Partial<CallToolResult>;

export type WidgetToolPayload =
	| WidgetToolResult
	| RentalWidgetData
	| null
	| undefined;
