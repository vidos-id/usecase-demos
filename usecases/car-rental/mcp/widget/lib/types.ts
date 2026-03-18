import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { BookingView } from "../../src/schemas/booking";

export type RentalWidgetData = {
	booking?: BookingView;
	widgetUri?: string;
	authorizationUrl?: string | null;
};

export type WidgetToolResult = Pick<CallToolResult, "structuredContent"> &
	Partial<CallToolResult>;

export type WidgetToolPayload =
	| WidgetToolResult
	| RentalWidgetData
	| null
	| undefined;
