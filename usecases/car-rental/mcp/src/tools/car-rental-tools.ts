import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { rentalTripContextSchema } from "demo-car-rental-shared/types/rental";
import { z } from "zod";
import { toBookingView, toSearchCarsResult } from "@/presenters/booking-view";
import { startAuthorizationMonitor } from "@/services/authorization-monitor";
import {
	createNonce,
	createVerificationSessionId,
	getBooking,
	searchCars,
	selectCar,
	setVerification,
} from "@/services/booking-store";
import { createAuthorization } from "@/services/vidos-client";
import { RENTAL_WIDGET_URI } from "@/ui/verification-widget";

const SearchCarsInputSchema = rentalTripContextSchema;

const SelectCarInputSchema = z.object({
	bookingSessionId: z.string(),
	vehicleId: z.string(),
});

const StartBookingInputSchema = z.object({
	bookingSessionId: z.string(),
});

const GetBookingStatusInputSchema = z.object({
	bookingSessionId: z.string(),
});

function toToolResult(
	message: string,
	data: Record<string, unknown>,
	isError = false,
	includeWidget = false,
): CallToolResult {
	return {
		content: [
			{ type: "text", text: message },
			...(includeWidget
				? [
						{
							type: "resource" as const,
							resource: {
								uri: RENTAL_WIDGET_URI,
								mimeType: "text/html",
								text: "Rental verification widget ready.",
							},
						},
					]
				: []),
		],
		structuredContent: data,
		data,
		isError,
	};
}

function formatSearchMessage(
	bookingSessionId: string,
	destination: string,
	results: ReturnType<typeof searchCars>["search"]["results"],
) {
	if (results.length === 0) {
		return `No cars matched the requested trip in ${destination}.`;
	}
	const lines = results.map((result, index) => {
		const vehicle = result.vehicle;
		return `${index + 1}. ${vehicle.name} - vehicleId: \`${vehicle.id}\`, ${vehicle.category}, licence ${vehicle.requiredLicenceCategory}, EUR ${vehicle.pricePerDay}/day, estimate EUR ${result.totalEstimate}. Best for: ${result.reason}.`;
	});
	return [
		`Found ${results.length} rental options for ${destination}. Fixed flow: 1) search_cars, 2) select_car, 3) start_booking. Do not ask for driver details, insurance, extras, or other add-ons in chat.`,
		...lines,
		`If the user picks one, call select_car with bookingSessionId ${bookingSessionId} and the exact vehicleId. After select_car succeeds, the next step is start_booking, which opens the widget-based wallet verification. Do not ask the user to paste licence details into chat.`,
	].join("\n");
}

async function searchCarsTool(args: unknown): Promise<CallToolResult> {
	const parsed = SearchCarsInputSchema.safeParse(args);
	if (!parsed.success) {
		return toToolResult(`Invalid input: ${parsed.error.message}`, {}, true);
	}
	const result = searchCars(parsed.data);
	return toToolResult(
		formatSearchMessage(
			result.booking.bookingSessionId,
			parsed.data.destination,
			result.search.results,
		),
		{
			bookingSessionId: result.booking.bookingSessionId,
			results: toSearchCarsResult(
				result.booking.bookingSessionId,
				result.search,
			).results,
		},
	);
}

async function selectCarTool(args: unknown): Promise<CallToolResult> {
	const parsed = SelectCarInputSchema.safeParse(args);
	if (!parsed.success) {
		return toToolResult(`Invalid input: ${parsed.error.message}`, {}, true);
	}
	try {
		const booking = selectCar(
			parsed.data.bookingSessionId,
			parsed.data.vehicleId,
		);
		if (!booking.selectedVehicle || !booking.requirements) {
			return toToolResult("Vehicle selection failed.", {}, true);
		}
		return toToolResult(
			`${booking.selectedVehicle.name} is selected in booking session ${booking.bookingSessionId}. Do not collect age, name, email, phone, insurance, or extras in chat. To continue, call start_booking with this bookingSessionId so the user can share their mDL in the UI widget.`,
			{ booking: toBookingView(booking) },
		);
	} catch (error) {
		return toToolResult(
			error instanceof Error ? error.message : "Failed to select vehicle",
			{},
			true,
		);
	}
}

async function startBookingTool(args: unknown): Promise<CallToolResult> {
	const parsed = StartBookingInputSchema.safeParse(args);
	if (!parsed.success) {
		return toToolResult(`Invalid input: ${parsed.error.message}`, {}, true);
	}
	try {
		const booking = getBooking(parsed.data.bookingSessionId);
		if (!booking.selectedVehicle || !booking.requirements) {
			return toToolResult(
				"Select a vehicle before starting booking.",
				{},
				true,
			);
		}

		const verificationSessionId = createVerificationSessionId();
		const authorization = await createAuthorization(createNonce());
		const verification = {
			verificationSessionId,
			authorizationId: authorization.authorizationId,
			authorizationUrl: authorization.authorizeUrl,
			lifecycle: "pending_wallet" as const,
			lastError: null,
			updatedAt: new Date().toISOString(),
		};
		const updated = setVerification(
			parsed.data.bookingSessionId,
			verification,
			"verification_required",
		);
		startAuthorizationMonitor(parsed.data.bookingSessionId);

		const text = [
			`Booking started for ${booking.selectedVehicle.name}.`,
			`Verification is required: licence category ${booking.requirements.requiredLicenceCategory} and a valid, non-expired driving licence.`,
			authorization.authorizeUrl
				? `Tell the user to use the UI widget to scan the wallet QR or open ${authorization.authorizeUrl}. Do not ask for the licence in chat.`
				: "Ask the user to complete wallet verification.",
			"Use get_booking_status to monitor progress until approval or failure. Only after approval is the booking finished and pickup details available.",
		].join("\n");

		return toToolResult(
			text,
			{
				booking: toBookingView(updated),
				widgetUri: RENTAL_WIDGET_URI,
				authorizationUrl: authorization.authorizeUrl,
			},
			false,
			true,
		);
	} catch (error) {
		return toToolResult(
			error instanceof Error ? error.message : "Failed to start booking",
			{},
			true,
		);
	}
}

async function getBookingStatusTool(args: unknown): Promise<CallToolResult> {
	const parsed = GetBookingStatusInputSchema.safeParse(args);
	if (!parsed.success) {
		return toToolResult(`Invalid input: ${parsed.error.message}`, {}, true);
	}
	try {
		const booking = getBooking(parsed.data.bookingSessionId);
		const plainText =
			booking.status === "approved" && booking.confirmation
				? `Verification approved for ${booking.selectedVehicle?.name}. Booking confirmed with reference ${booking.confirmation.bookingReference}. Pickup locker ${booking.confirmation.lockerId}, PIN ${booking.confirmation.lockerPin}.`
				: booking.status === "rejected" && booking.eligibility
					? `Booking rejected. ${booking.eligibility.reasonText}`
					: booking.status === "expired"
						? "Verification expired. Restart booking to issue a fresh wallet request."
						: booking.status === "error"
							? `Verification failed. ${booking.verification?.lastError ?? booking.eligibility?.reasonText ?? "Unknown authorizer error."}`
							: `Booking ${booking.bookingSessionId} is waiting for wallet verification in the UI widget.`;

		return toToolResult(
			plainText,
			{
				booking: toBookingView(booking),
			},
			false,
			Boolean(booking.verification),
		);
	} catch (error) {
		return toToolResult(
			error instanceof Error ? error.message : "Failed to load booking status",
			{},
			true,
		);
	}
}

export function registerCarRentalTools(server: McpServer) {
	registerAppTool(
		server,
		"search_cars",
		{
			description:
				"Search rental cars by destination and trip context. Keep the conversation tightly scoped to search, select_car, and start_booking only.",
			inputSchema: SearchCarsInputSchema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
			_meta: { ui: { visibility: ["model", "app"] } },
		},
		searchCarsTool,
	);

	registerAppTool(
		server,
		"select_car",
		{
			description:
				"Select one vehicle from the previous search results. This is a safe step and must not trigger collection of extra details in chat.",
			inputSchema: SelectCarInputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
			_meta: { ui: { visibility: ["model", "app"] } },
		},
		selectCarTool,
	);

	registerAppTool(
		server,
		"start_booking",
		{
			description:
				"Start booking for the selected vehicle and launch widget-based wallet verification. The user shares the mDL in the UI widget, never in chat.",
			inputSchema: StartBookingInputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: true,
			},
			_meta: { ui: { resourceUri: RENTAL_WIDGET_URI } },
		},
		startBookingTool,
	);

	registerAppTool(
		server,
		"get_booking_status",
		{
			description:
				"Get the current booking and verification status. The widget uses this to poll until approval or failure.",
			inputSchema: GetBookingStatusInputSchema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
			_meta: { ui: { visibility: ["model", "app"] } },
		},
		getBookingStatusTool,
	);
}
