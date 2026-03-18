import {
	Check,
	CheckCircle2,
	CreditCard,
	LoaderCircle,
	QrCode,
	ShieldCheck,
	ShoppingCart,
	Sparkles,
	Wine,
} from "lucide-react";
import {
	AnimatedChatMockup,
	type ChatMockupConfig,
	MockupAssistantRow,
	type MockupVariant,
} from "./animated-chat-mockup";

type VerifyPhase = "waiting" | "scanning" | "proof" | "done";
type PayPhase = "idle" | "paying" | "done";

type WineMockupState = {
	payPhase: PayPhase;
	searchStatus: "done" | "running";
	verifyPhase: VerifyPhase;
};

const PHASES = {
	msg1: 300,
	msg2: 1100,
	msg3: 1900,
	tool1Start: 2500,
	tool1Done: 3600,
	msg4: 4000,
	msg5: 4800,
	tool2: 5300,
	msg6: 5800,
	tool3: 6400,
	widget: 7000,
	widgetScan: 9000,
	widgetProof: 10500,
	widgetDone: 12000,
	msg7: 12600,
	payment: 13200,
	paymentPay: 15200,
	paymentDone: 16200,
	msg8: 17000,
} as const;

function WineResultsCard({ variant }: { variant: MockupVariant }) {
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
				<p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#aaa]">
					Wine search results
				</p>
				<div className="grid gap-2 sm:grid-cols-3">
					{[
						{
							desc: "Cherry, oak - perfect for candlelit dinners",
							highlight: true,
							name: "Rioja Reserva",
						},
						{
							desc: "Savory, elegant, food-friendly",
							name: "Chianti Classico",
						},
						{ desc: "Light body, smooth finish", name: "Pinot Noir" },
					].map((wine) => (
						<div
							key={wine.name}
							className={`rounded-xl border p-3 ${
								wine.highlight
									? "border-[#722F3740] bg-[#FDF8F3]"
									: "border-[#f0f0f0] bg-[#fafafa]"
							}`}
						>
							<div className="flex items-center gap-1.5">
								<Wine
									className="h-3.5 w-3.5 shrink-0"
									style={{ color: "#722F37" }}
								/>
								<p className="text-[13px] font-semibold text-[#1a1a1a]">
									{wine.name}
								</p>
							</div>
							<p className="mt-1 text-[11px] leading-snug text-[#888]">
								{wine.desc}
							</p>
						</div>
					))}
				</div>
			</div>
		</MockupAssistantRow>
	);
}

function VerificationWidget({
	phase,
	variant,
}: {
	phase: VerifyPhase;
	variant: MockupVariant;
}) {
	const wine = "#722F37";

	const statusText: Record<VerifyPhase, string> = {
		done: "Verification succeeded",
		proof: "Wallet proof received. Finalizing age verification...",
		scanning: "Scanning...",
		waiting: "Waiting for wallet scan...",
	};

	return (
		<MockupAssistantRow variant={variant}>
			<div
				style={{
					background: "#FDF8F3",
					border: `1px solid ${wine}15`,
					borderRadius: "16px",
					boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
					maxWidth: "340px",
					padding: "16px",
					width: "100%",
				}}
			>
				<div className="mb-3 flex items-center gap-2">
					<ShieldCheck className="h-4 w-4" style={{ color: wine }} />
					<p className="text-sm font-semibold" style={{ color: wine }}>
						Checkout Verification
					</p>
				</div>

				<div
					style={{
						background: "#fff",
						border: `2px solid ${wine}20`,
						borderRadius: "12px",
						overflow: "hidden",
						padding: "24px",
						position: "relative",
					}}
				>
					<div
						className="flex items-center justify-center"
						style={{ aspectRatio: "1 / 1", width: "100%" }}
					>
						<QrCode
							style={{
								color: wine,
								height: "80%",
								opacity: 0.85,
								width: "80%",
							}}
							strokeWidth={1}
						/>
					</div>

					{(phase === "scanning" || phase === "waiting") && (
						<div
							style={{
								animation: "cgpt-scan-line 2s linear infinite",
								background: `linear-gradient(90deg, transparent, ${wine}, transparent)`,
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
								background: "rgba(255,255,255,0.88)",
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

				<div
					style={{
						background: `${wine}08`,
						borderRadius: "8px",
						marginTop: "10px",
						padding: "8px 10px",
					}}
				>
					<p className="text-xs" style={{ color: "#2D1810" }}>
						Scan this QR code with your{" "}
						<span className="font-semibold">EUDI Wallet app</span>
					</p>
				</div>

				<div className="mt-2.5 flex items-center gap-1.5">
					{phase === "done" ? (
						<CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
					) : (
						<LoaderCircle
							className="h-3.5 w-3.5 animate-spin"
							style={{ color: wine }}
						/>
					)}
					<p
						className="text-xs"
						style={{
							color: phase === "done" ? "#1a7a46" : "#2D1810",
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

function PaymentWidget({
	phase,
	variant,
}: {
	phase: PayPhase;
	variant: MockupVariant;
}) {
	const wine = "#722F37";

	return (
		<MockupAssistantRow variant={variant} animation="payment">
			<div
				style={{
					background: "linear-gradient(180deg, #fffaf6 0%, #fff 100%)",
					border: `1px solid ${wine}18`,
					borderRadius: "16px",
					boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
					maxWidth: "340px",
					padding: "16px",
					width: "100%",
				}}
			>
				<div className="mb-3 flex items-center gap-2">
					<CreditCard className="h-4 w-4" style={{ color: wine }} />
					<p className="text-sm font-semibold" style={{ color: wine }}>
						Complete your Vinos payment
					</p>
				</div>

				{phase !== "done" ? (
					<>
						<div className="space-y-2">
							{[
								{ label: "Cardholder", value: "Ava Shopper" },
								{ label: "Card number", value: "4242 4242 4242 4242" },
								{ label: "Expiry", value: "12/28" },
								{ label: "CVC", value: "123" },
							].map((field) => (
								<div key={field.label}>
									<p
										className="mb-0.5 text-[10px] font-medium uppercase tracking-wide"
										style={{ color: "#999" }}
									>
										{field.label}
									</p>
									<div
										style={{
											background: "#f5f5f5",
											border: "1px solid #e0e0e0",
											borderRadius: "8px",
											color: "#555",
											fontSize: "13px",
											padding: "6px 10px",
										}}
									>
										{field.value}
									</div>
								</div>
							))}
						</div>

						<button
							type="button"
							style={{
								alignItems: "center",
								background: phase === "paying" ? "#a05060" : wine,
								border: "none",
								borderRadius: "999px",
								color: "#fff",
								cursor: "default",
								display: "flex",
								fontSize: "13px",
								fontWeight: 600,
								gap: "6px",
								justifyContent: "center",
								marginTop: "12px",
								padding: "9px 0",
								transition: "background 200ms",
								width: "100%",
							}}
						>
							{phase === "paying" ? (
								<>
									<LoaderCircle className="h-3.5 w-3.5 animate-spin" />
									Processing...
								</>
							) : (
								"Pay now"
							)}
						</button>
					</>
				) : (
					<div
						style={{
							alignItems: "center",
							animation: "cgpt-fade-in 400ms ease-out both",
							background: "#eaf7ef",
							border: "1px solid #b6e8c8",
							borderRadius: "10px",
							display: "flex",
							gap: "8px",
							padding: "12px",
						}}
					>
						<CheckCircle2 className="h-5 w-5 shrink-0 text-[#22c55e]" />
						<p className="text-sm font-semibold text-[#1a7a46]">
							Payment successful.
						</p>
					</div>
				)}
			</div>
		</MockupAssistantRow>
	);
}

const wineMockupConfig: ChatMockupConfig<WineMockupState> = {
	ariaLabel: "wine conversation mockup",
	brandLabel: "Vinos Wine Store",
	initialState: {
		payPhase: "idle",
		searchStatus: "running",
		verifyPhase: "waiting",
	},
	items: [
		{
			content: "I'd like to buy a wine for a romantic dinner with my wife.",
			id: "user-1",
			showAt: 1,
			type: "user-message",
		},
		{
			content:
				"Happy to help! Do you have a style in mind - red, white, sparkling, or rose?",
			id: "assistant-1",
			showAt: 2,
			type: "assistant-message",
		},
		{
			content: "Red would be nice.",
			id: "user-2",
			showAt: 3,
			type: "user-message",
		},
		{
			icon: <Sparkles className="h-3.5 w-3.5" />,
			id: "tool-search",
			label: "search_wines",
			showAt: 4,
			status: ({ state }) => state.searchStatus,
			type: "tool-call",
		},
		{
			id: "results",
			render: ({ variant }) => <WineResultsCard variant={variant} />,
			showAt: 5,
			type: "custom",
		},
		{
			content: (
				<>
					I found a few great matches. <strong>Rioja Reserva</strong> would be
					perfect for a romantic evening. Want me to add it to your cart?
				</>
			),
			id: "assistant-2",
			showAt: 6,
			type: "assistant-message",
		},
		{
			content: "Yes, buy the Rioja Reserva.",
			id: "user-3",
			showAt: 7,
			type: "user-message",
		},
		{
			icon: <ShoppingCart className="h-3.5 w-3.5" />,
			id: "tool-cart",
			label: "add_to_cart",
			showAt: 8,
			status: "success",
			successLabel: "1 item added",
			type: "tool-call",
		},
		{
			content:
				"Done - Rioja Reserva is in your cart. I'll start checkout now. Since this is an age-restricted purchase, you'll need to verify your age.",
			id: "assistant-3",
			showAt: 9,
			type: "assistant-message",
		},
		{
			icon: <ShoppingCart className="h-3.5 w-3.5" />,
			id: "tool-checkout",
			label: "initiate_checkout",
			showAt: 10,
			status: "done",
			type: "tool-call",
		},
		{
			id: "verify-widget",
			render: ({ state, variant }) => (
				<VerificationWidget phase={state.verifyPhase} variant={variant} />
			),
			showAt: 11,
			type: "custom",
		},
		{
			content: "Age verified! Here's your payment form.",
			id: "assistant-4",
			showAt: 12,
			type: "assistant-message",
		},
		{
			id: "payment-widget",
			render: ({ state, variant }) => (
				<PaymentWidget phase={state.payPhase} variant={variant} />
			),
			showAt: 13,
			type: "custom",
		},
		{
			content: (
				<>
					Payment successful! Your <strong>Rioja Reserva</strong> will be
					shipped soon. Enjoy your romantic dinner! 🍷
				</>
			),
			id: "assistant-5",
			showAt: 14,
			type: "assistant-message",
		},
	],
	stateTransitions: [
		{ at: PHASES.tool1Done, patch: { searchStatus: "done" } },
		{ at: PHASES.widgetScan, patch: { verifyPhase: "scanning" } },
		{ at: PHASES.widgetProof, patch: { verifyPhase: "proof" } },
		{ at: PHASES.widgetDone, patch: { verifyPhase: "done" } },
		{ at: PHASES.paymentPay, patch: { payPhase: "paying" } },
		{ at: PHASES.paymentDone, patch: { payPhase: "done" } },
	],
	stepTimings: [
		PHASES.msg1,
		PHASES.msg2,
		PHASES.msg3,
		PHASES.tool1Start,
		PHASES.tool1Done,
		PHASES.msg4,
		PHASES.msg5,
		PHASES.tool2,
		PHASES.msg6,
		PHASES.tool3,
		PHASES.widget,
		PHASES.msg7,
		PHASES.payment,
		PHASES.msg8,
	],
};

export function ChatGptWineMockup({
	variant = "chatgpt",
}: {
	variant?: MockupVariant;
}) {
	return <AnimatedChatMockup config={wineMockupConfig} variant={variant} />;
}
