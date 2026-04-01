import {
	CheckCircle2,
	KeyRound,
	Link,
	Search,
	ShieldCheck,
	ShoppingCart,
	Ticket,
} from "lucide-react";
import {
	AnimatedChatMockup,
	type ChatMockupConfig,
	MockupAssistantRow,
	type MockupVariant,
} from "./animated-chat-mockup";

type TicketAgentState = {
	walletInitStatus: "done" | "running";
	redeemStatus: "done" | "running";
	searchStatus: "done" | "running";
	bookingStatus: "done" | "running";
	presentStatus: "done" | "running";
	pollStatus: "done" | "running";
};

const PHASES = {
	bootstrapPrompt: 300,
	assistantIntro: 1200,
	walletInit: 2600,
	walletInitDone: 3800,
	userOffer: 4700,
	redeemStart: 5400,
	redeemDone: 6800,
	redeemMsg: 7400,
	userSearch: 8600,
	searchStart: 9400,
	searchDone: 10400,
	resultsMsg: 11000,
	userBook: 12200,
	bookingStart: 13000,
	bookingDone: 13800,
	presentStart: 14200,
	presentDone: 15400,
	pollStart: 15800,
	pollDone: 16800,
	confirmMsg: 17400,
} as const;

function Oid4vciOfferCard({ variant }: { variant: MockupVariant }) {
	const isOpenClaw = variant === "openclaw";

	return (
		<div className="flex items-start justify-end gap-3">
			<div
				className={
					isOpenClaw
						? "max-w-[84%] rounded-[18px] rounded-br-[6px] px-4 py-2.5 text-sm text-[#123247]"
						: "max-w-[84%] rounded-2xl rounded-tr-sm bg-[#f4f4f4] px-4 py-2.5 text-sm text-[#1a1a1a]"
				}
				style={
					isOpenClaw
						? {
								background: "#dff4ff",
								border: "1px solid #c8e7f9",
								boxShadow: "0 1px 3px rgba(27, 78, 111, 0.08)",
							}
						: undefined
				}
			>
				<p className="text-sm text-inherit">
					Here&apos;s the OID4VCI delegation offer from VidoShow. Redeem this so
					you can book on my behalf:
				</p>
				<div className="mt-3 rounded-lg border border-white/60 bg-white/70 px-3 py-2 font-mono text-[11px] leading-relaxed text-[#4b5563]">
					<p className="truncate">
						oid4vci://credential-offer?credential_offer_uri=https://vidoshow
						.example/api/delegation/offers/2f3c1...
					</p>
				</div>
			</div>
			<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8e3dd] text-[#555]">
				U
			</div>
		</div>
	);
}

function TicketResultsCard({ variant }: { variant: MockupVariant }) {
	const isOpenClaw = variant === "openclaw";

	return (
		<MockupAssistantRow variant={variant}>
			<div
				className={
					isOpenClaw
						? "w-full max-w-[88%] rounded-[18px] rounded-bl-[6px] border px-4 py-3 text-sm"
						: "w-full max-w-[88%] rounded-2xl rounded-tl-sm border border-[#e5e5e5] bg-white px-4 py-3 text-sm shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
				}
				style={
					isOpenClaw
						? {
								background: "#ffffff",
								border: "1px solid #d9e7f1",
								boxShadow: "0 1px 3px rgba(27, 78, 111, 0.08)",
							}
						: undefined
				}
			>
				<p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#8a97a4]">
					Event matches
				</p>
				<div className="rounded-xl border border-[#d9e7f1] bg-[#f8fbfe] p-3">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f2ff] text-[#2563eb]">
							<Ticket className="h-4 w-4" />
						</div>
						<div>
							<p className="text-[13px] font-semibold text-[#111827]">
								Berlin Philharmonic Summer Gala
							</p>
							<p className="text-[11px] text-[#6b7280]">
								Berlin - July 15, 2026 - from EUR 68
							</p>
						</div>
					</div>
					<p className="mt-2 text-[11px] leading-snug text-[#64748b]">
						Best match for a concert in Berlin with seats available together.
					</p>
				</div>
			</div>
		</MockupAssistantRow>
	);
}

const ticketAgentMockupConfig: ChatMockupConfig<TicketAgentState> = {
	ariaLabel: "VidoShow OID4VCI conversation mockup",
	brandLabel: "VidoShow",
	openClawBrandLabel: "VidoShow OID4VCI",
	initialState: {
		walletInitStatus: "running",
		redeemStatus: "running",
		searchStatus: "running",
		bookingStatus: "running",
		presentStatus: "running",
		pollStatus: "running",
	},
	items: [
		{
			content:
				"Read https://raw.githubusercontent.com/vidos-id/usecase-demos/main/usecases/ticket-agent/server/skill.md and follow the instructions for this session.",
			id: "user-0",
			showAt: 1,
			type: "user-message",
		},
		{
			content:
				"Ticket-agent skill loaded. First, verify your identity in VidoShow and create a booking-only delegation offer on My Agent. Then send me the OID4VCI offer URL or deep link and I’ll redeem it into my wallet.",
			id: "assistant-1",
			showAt: 2,
			type: "assistant-message",
		},
		{
			icon: <KeyRound className="h-3.5 w-3.5" />,
			id: "tool-wallet-init",
			label: "wallet-cli init",
			showAt: 3,
			status: ({ state }) => state.walletInitStatus,
			type: "tool-call",
		},
		{
			id: "user-offer",
			render: ({ variant }) => <Oid4vciOfferCard variant={variant} />,
			showAt: 4,
			type: "custom",
		},
		{
			icon: <Link className="h-3.5 w-3.5" />,
			id: "tool-redeem",
			label: "wallet-cli oid4vci redeem",
			showAt: 5,
			status: ({ state }) => state.redeemStatus,
			type: "tool-call",
		},
		{
			content:
				"The offer redeemed successfully. I now hold your booking delegation credential and can use it at purchase time. What event should I look for?",
			id: "assistant-2",
			showAt: 6,
			type: "assistant-message",
		},
		{
			content: "Find me a concert in Berlin",
			id: "user-1",
			showAt: 7,
			type: "user-message",
		},
		{
			icon: <Search className="h-3.5 w-3.5" />,
			id: "tool-search",
			label: "search_events",
			showAt: 8,
			status: ({ state }) => state.searchStatus,
			type: "tool-call",
		},
		{
			id: "results",
			render: ({ variant }) => <TicketResultsCard variant={variant} />,
			showAt: 9,
			type: "custom",
		},
		{
			content:
				"I found a strong match: Berlin Philharmonic Summer Gala on July 15, 2026. Want me to book 2 tickets together? I’ll present the delegated credential during checkout.",
			id: "assistant-3",
			showAt: 10,
			type: "assistant-message",
		},
		{
			content: "Book 2 tickets for the Philharmonic",
			id: "user-2",
			showAt: 11,
			type: "user-message",
		},
		{
			icon: <ShoppingCart className="h-3.5 w-3.5" />,
			id: "tool-booking",
			label: "create_booking",
			showAt: 12,
			status: ({ state }) => state.bookingStatus,
			type: "tool-call",
		},
		{
			doneLabel: "Presenting delegated credential...",
			icon: <ShieldCheck className="h-3.5 w-3.5" />,
			id: "tool-present",
			label: "wallet-cli present",
			showAt: 13,
			status: ({ state }) => state.presentStatus,
			type: "tool-call",
		},
		{
			icon: <CheckCircle2 className="h-3.5 w-3.5" />,
			id: "tool-poll",
			label: "poll_booking_status",
			showAt: 14,
			status: ({ state }) =>
				state.pollStatus === "done" ? "success" : "running",
			successLabel: "Confirmed",
			type: "tool-call",
		},
		{
			content:
				"Your booking is confirmed! 2 tickets for Berlin Philharmonic Summer Gala on July 15, 2026. Booked under Anna Schmidt.",
			id: "assistant-4",
			showAt: 15,
			type: "assistant-message",
		},
	],
	stateTransitions: [
		{ at: PHASES.walletInitDone, patch: { walletInitStatus: "done" } },
		{ at: PHASES.redeemDone, patch: { redeemStatus: "done" } },
		{ at: PHASES.searchDone, patch: { searchStatus: "done" } },
		{ at: PHASES.bookingDone, patch: { bookingStatus: "done" } },
		{ at: PHASES.presentDone, patch: { presentStatus: "done" } },
		{ at: PHASES.pollDone, patch: { pollStatus: "done" } },
	],
	stepTimings: [
		PHASES.bootstrapPrompt,
		PHASES.assistantIntro,
		PHASES.walletInit,
		PHASES.userOffer,
		PHASES.redeemStart,
		PHASES.redeemMsg,
		PHASES.userSearch,
		PHASES.searchStart,
		PHASES.searchDone,
		PHASES.resultsMsg,
		PHASES.userBook,
		PHASES.bookingStart,
		PHASES.presentStart,
		PHASES.pollStart,
		PHASES.confirmMsg,
	],
};

export function ChatGptTicketAgentMockup({
	variant = "chatgpt",
}: {
	variant?: MockupVariant;
}) {
	return (
		<AnimatedChatMockup config={ticketAgentMockupConfig} variant={variant} />
	);
}
