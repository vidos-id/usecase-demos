import {
	CarFront,
	Check,
	CheckCircle2,
	KeyRound,
	LoaderCircle,
	MapPinned,
	QrCode,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import {
	AnimatedChatMockup,
	type ChatMockupConfig,
	MockupAssistantRow,
	type MockupVariant,
} from "./animated-chat-mockup";

type RentalVerifyPhase = "waiting" | "scanning" | "proof" | "done";

type CarRentalMockupState = {
	bookingStatus: "done" | "running";
	searchStatus: "done" | "running";
	statusStatus: "done" | "running";
	verifyPhase: RentalVerifyPhase;
};

const PHASES = {
	msg1: 300,
	tool1Start: 1000,
	tool1Done: 2100,
	msg2: 2500,
	msg3: 3600,
	tool2: 4300,
	msg4: 5000,
	tool3Start: 5900,
	widget: 6700,
	widgetScan: 8600,
	widgetProof: 10100,
	widgetDone: 11600,
	msg5: 12300,
	tool4Start: 13000,
	tool4Done: 14200,
	msg6: 14900,
} as const;

function CarResultsCard({ variant }: { variant: MockupVariant }) {
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
					Top rental matches
				</p>
				<div className="grid gap-2 sm:grid-cols-3">
					{[
						{
							desc: "EUR 72/day - automatic SUV with luggage space for island roads",
							highlight: true,
							name: "Volkswagen Tiguan",
						},
						{
							desc: "EUR 74/day - premium compact SUV with strong visibility",
							name: "BMW X1",
						},
						{
							desc: "EUR 38/day - easy parking and best value for two travellers",
							name: "Renault Clio",
						},
					].map((car) => (
						<div
							key={car.name}
							className={`rounded-xl border p-3 ${
								car.highlight
									? "border-[#0f766e33] bg-[#f3fbfa]"
									: "border-[#edf1f4] bg-[#fafcfd]"
							}`}
						>
							<div className="flex items-center gap-1.5">
								<CarFront className="h-3.5 w-3.5 shrink-0 text-[#0f766e]" />
								<p className="text-[13px] font-semibold text-[#1a1a1a]">
									{car.name}
								</p>
							</div>
							<p className="mt-1 text-[11px] leading-snug text-[#78828d]">
								{car.desc}
							</p>
						</div>
					))}
				</div>
			</div>
		</MockupAssistantRow>
	);
}

function RentalVerificationWidget({
	phase,
	variant,
}: {
	phase: RentalVerifyPhase;
	variant: MockupVariant;
}) {
	const teal = "#0f766e";

	const statusText: Record<RentalVerifyPhase, string> = {
		done: "Driving licence approved",
		proof: "Proof received. Checking licence category and age...",
		scanning: "Waiting for wallet approval...",
		waiting: "Scan with wallet to continue booking",
	};

	return (
		<MockupAssistantRow variant={variant}>
			<div
				style={{
					background: "linear-gradient(180deg, #f3fbfa 0%, #ffffff 100%)",
					border: `1px solid ${teal}18`,
					borderRadius: "18px",
					boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
					maxWidth: "360px",
					padding: "16px",
					width: "100%",
				}}
			>
				<div className="mb-3 flex items-center gap-2">
					<ShieldCheck className="h-4 w-4" style={{ color: teal }} />
					<p className="text-sm font-semibold" style={{ color: teal }}>
						Rental eligibility check
					</p>
				</div>

				<div className="grid gap-2 sm:grid-cols-2">
					<div className="rounded-xl border border-[#d7ece8] bg-white p-3">
						<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f7f88]">
							Requirement
						</p>
						<p className="mt-2 text-sm font-semibold text-[#1f2937]">
							Minimum age 23
						</p>
						<p className="mt-1 text-xs text-[#6b7280]">Licence category B</p>
					</div>
					<div className="rounded-xl border border-[#d7ece8] bg-white p-3">
						<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f7f88]">
							Vehicle
						</p>
						<p className="mt-2 text-sm font-semibold text-[#1f2937]">
							Volkswagen Tiguan
						</p>
						<p className="mt-1 text-xs text-[#6b7280]">
							Tenerife airport pickup
						</p>
					</div>
				</div>

				<div
					style={{
						background: "#fff",
						border: `2px solid ${teal}18`,
						borderRadius: "12px",
						marginTop: "12px",
						overflow: "hidden",
						padding: "22px",
						position: "relative",
					}}
				>
					<div
						className="flex items-center justify-center"
						style={{ aspectRatio: "1 / 1", width: "100%" }}
					>
						<QrCode
							style={{
								color: teal,
								height: "78%",
								opacity: 0.88,
								width: "78%",
							}}
							strokeWidth={1}
						/>
					</div>

					{phase !== "done" && (
						<div
							style={{
								animation: "cgpt-scan-line 2s linear infinite",
								background: `linear-gradient(90deg, transparent, ${teal}, transparent)`,
								height: "2px",
								left: 0,
								position: "absolute",
								right: 0,
							}}
						/>
					)}

					{phase === "done" && (
						<div
							style={{
								alignItems: "center",
								animation: "cgpt-fade-in 300ms ease-out both",
								background: "rgba(255,255,255,0.9)",
								display: "flex",
								inset: 0,
								justifyContent: "center",
								position: "absolute",
							}}
						>
							<div
								style={{
									alignItems: "center",
									animation:
										"cgpt-check-pop 450ms cubic-bezier(.34,1.56,.64,1) both",
									background: "#22c55e",
									borderRadius: "50%",
									boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
									display: "flex",
									height: 48,
									justifyContent: "center",
									width: 48,
								}}
							>
								<Check className="h-6 w-6 text-white" />
							</div>
						</div>
					)}
				</div>

				<div className="mt-3 flex items-center gap-1.5 text-xs text-[#475569]">
					<MapPinned className="h-3.5 w-3.5 text-[#0f766e]" />
					Share age and mobile driving licence claims from your wallet.
				</div>

				<div className="mt-2.5 flex items-center gap-1.5">
					{phase === "done" ? (
						<CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
					) : (
						<LoaderCircle
							className="h-3.5 w-3.5 animate-spin"
							style={{ color: teal }}
						/>
					)}
					<p
						className="text-xs"
						style={{
							color: phase === "done" ? "#166534" : "#334155",
							fontWeight: phase === "done" ? 600 : 400,
						}}
					>
						{statusText[phase]}
					</p>
				</div>
			</div>
		</MockupAssistantRow>
	);
}

const carRentalMockupConfig: ChatMockupConfig<CarRentalMockupState> = {
	ariaLabel: "car rental conversation mockup",
	brandLabel: "Vidos Drive Concierge",
	initialState: {
		bookingStatus: "running",
		searchStatus: "running",
		statusStatus: "running",
		verifyPhase: "waiting",
	},
	items: [
		{
			content:
				"I need a rental car in Tenerife for five days with room for luggage.",
			id: "user-1",
			showAt: 1,
			type: "user-message",
		},
		{
			icon: <Sparkles className="h-3.5 w-3.5" />,
			id: "tool-search",
			label: "search_cars",
			showAt: 2,
			status: ({ state }) => state.searchStatus,
			type: "tool-call",
		},
		{
			id: "results",
			render: ({ variant }) => <CarResultsCard variant={variant} />,
			showAt: 3,
			type: "custom",
		},
		{
			content: (
				<>
					The <strong>Volkswagen Tiguan</strong> is the best fit - automatic,
					solid luggage room, and easy for Tenerife hill roads. Want me to
					reserve it?
				</>
			),
			id: "assistant-1",
			showAt: 4,
			type: "assistant-message",
		},
		{
			content: "Yes, book the Volkswagen Tiguan.",
			id: "user-2",
			showAt: 5,
			type: "user-message",
		},
		{
			doneLabel: "Vehicle selected",
			icon: <CarFront className="h-3.5 w-3.5" />,
			id: "tool-select",
			label: "select_car",
			showAt: 6,
			status: "done",
			type: "tool-call",
		},
		{
			content:
				"Great - I locked the Tiguan into your booking session. I'll start the booking now and check your age plus driving licence eligibility.",
			id: "assistant-2",
			showAt: 7,
			type: "assistant-message",
		},
		{
			icon: <ShieldCheck className="h-3.5 w-3.5" />,
			id: "tool-start-booking",
			label: "start_booking",
			showAt: 8,
			status: ({ state }) => state.bookingStatus,
			type: "tool-call",
		},
		{
			id: "verify-widget",
			render: ({ state, variant }) => (
				<RentalVerificationWidget phase={state.verifyPhase} variant={variant} />
			),
			showAt: 9,
			type: "custom",
		},
		{
			content:
				"Your wallet proof is accepted. I'll fetch the final booking status and pickup details.",
			id: "assistant-3",
			showAt: 10,
			type: "assistant-message",
		},
		{
			doneLabel: "Approved",
			icon: <KeyRound className="h-3.5 w-3.5" />,
			id: "tool-status",
			label: "get_booking_status",
			showAt: 11,
			status: ({ state }) => state.statusStatus,
			type: "tool-call",
		},
		{
			content: (
				<>
					Booked. Your <strong>Volkswagen Tiguan</strong> is confirmed with
					reference
					<strong>TFN-48291</strong>. Pickup locker <strong>A12</strong>, PIN
					<strong>7314</strong> at Tenerife airport.
				</>
			),
			id: "assistant-4",
			showAt: 12,
			type: "assistant-message",
		},
	],
	stateTransitions: [
		{ at: PHASES.tool1Done, patch: { searchStatus: "done" } },
		{ at: PHASES.tool3Start, patch: { bookingStatus: "done" } },
		{ at: PHASES.widgetScan, patch: { verifyPhase: "scanning" } },
		{ at: PHASES.widgetProof, patch: { verifyPhase: "proof" } },
		{ at: PHASES.widgetDone, patch: { verifyPhase: "done" } },
		{ at: PHASES.tool4Done, patch: { statusStatus: "done" } },
	],
	stepTimings: [
		PHASES.msg1,
		PHASES.tool1Start,
		PHASES.tool1Done,
		PHASES.msg2,
		PHASES.msg3,
		PHASES.tool2,
		PHASES.msg4,
		PHASES.tool3Start,
		PHASES.widget,
		PHASES.msg5,
		PHASES.tool4Start,
		PHASES.msg6,
	],
};

export function ChatGptCarRentalMockup({
	variant = "chatgpt",
}: {
	variant?: MockupVariant;
}) {
	return (
		<AnimatedChatMockup config={carRentalMockupConfig} variant={variant} />
	);
}
