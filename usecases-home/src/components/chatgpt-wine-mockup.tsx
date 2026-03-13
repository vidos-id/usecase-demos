import {
	Bot,
	Check,
	CheckCircle2,
	CreditCard,
	LoaderCircle,
	QrCode,
	ShieldCheck,
	ShoppingCart,
	Sparkles,
	User,
	Wine,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Animation keyframes injected once via <style>
// ---------------------------------------------------------------------------

const KEYFRAMES = `
@keyframes cgpt-msg-in {
	from { opacity: 0; transform: translateY(8px); }
	to   { opacity: 1; transform: translateY(0);   }
}
@keyframes cgpt-tool-pulse {
	0%, 100% { opacity: 1; }
	50%       { opacity: 0.45; }
}
@keyframes cgpt-scan-line {
	0%   { top: 0;    opacity: 0; }
	8%   { opacity: 1; }
	92%  { opacity: 1; }
	100% { top: 100%; opacity: 0; }
}
@keyframes cgpt-check-pop {
	0%   { opacity: 0; transform: scale(0.4); }
	60%  { transform: scale(1.15); }
	80%  { transform: scale(0.95); }
	100% { opacity: 1; transform: scale(1); }
}
@keyframes cgpt-fade-in {
	from { opacity: 0; }
	to   { opacity: 1; }
}
@keyframes cgpt-payment-in {
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0);   }
}
`;

// ---------------------------------------------------------------------------
// Sequence phases (ms from component mount)
// ---------------------------------------------------------------------------
const PHASES = {
	msg1: 300, // user: romantic dinner
	msg2: 1100, // assistant: style?
	msg3: 1900, // user: red
	tool1Start: 2500, // search_wines running
	tool1Done: 3600, // search_wines complete + results
	msg4: 4000, // assistant: rioja
	msg5: 4800, // user: buy rioja
	tool2: 5300, // add_to_cart done
	msg6: 5800, // assistant: done, need age verify
	tool3: 6400, // initiate_checkout
	widget: 7000, // verification widget appears
	widgetScan: 9000, // scan animation starts → already running from widget mount
	widgetProof: 10500, // "Wallet proof received"
	widgetDone: 12000, // verified ✓
	msg7: 12600, // assistant: age verified
	payment: 13200, // payment panel
	paymentPay: 15200, // auto-pay click
	paymentDone: 16200, // success
	msg8: 17000, // assistant: order confirmed
} as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GptAvatar() {
	return (
		<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10a37f]">
			<Bot className="h-4 w-4 text-white" />
		</div>
	);
}

function UserAvatar() {
	return (
		<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8e3dd]">
			<User className="h-4 w-4 text-[#555]" />
		</div>
	);
}

function AssistantMessage({
	children,
	delay = 0,
}: {
	children: React.ReactNode;
	delay?: number;
}) {
	return (
		<div
			className="flex items-start gap-3"
			style={{
				animation: `cgpt-msg-in 350ms ease-out ${delay}ms both`,
			}}
		>
			<GptAvatar />
			<div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-[#1a1a1a] shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-[#e5e5e5]">
				{children}
			</div>
		</div>
	);
}

function UserMessage({
	children,
	delay = 0,
}: {
	children: React.ReactNode;
	delay?: number;
}) {
	return (
		<div
			className="flex items-start justify-end gap-3"
			style={{
				animation: `cgpt-msg-in 350ms ease-out ${delay}ms both`,
			}}
		>
			<div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#f4f4f4] px-4 py-2.5 text-sm text-[#1a1a1a]">
				{children}
			</div>
			<UserAvatar />
		</div>
	);
}

function ToolCallRow({
	icon,
	label,
	status,
	delay = 0,
}: {
	icon: React.ReactNode;
	label: string;
	status: "running" | "done" | "success";
	delay?: number;
}) {
	return (
		<div
			className="flex items-start gap-3"
			style={{
				animation: `cgpt-msg-in 350ms ease-out ${delay}ms both`,
			}}
		>
			<GptAvatar />
			<div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[#e5e5e5] bg-white px-3.5 py-2 text-xs text-[#555] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
				<span
					className="text-[#10a37f]"
					style={
						status === "running"
							? { animation: "cgpt-tool-pulse 1s ease-in-out infinite" }
							: undefined
					}
				>
					{icon}
				</span>
				<span className="font-mono font-medium text-[#333]">{label}</span>
				{status === "running" && (
					<LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#aaa]" />
				)}
				{status === "done" && (
					<span className="rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] text-[#777]">
						Complete
					</span>
				)}
				{status === "success" && (
					<span className="flex items-center gap-1 rounded-full bg-[#eaf7ef] px-2 py-0.5 text-[10px] text-[#1a7a46]">
						<CheckCircle2 className="h-3 w-3" />1 item added
					</span>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Wine results card
// ---------------------------------------------------------------------------

function WineResultsCard({ delay = 0 }: { delay?: number }) {
	return (
		<div
			className="flex items-start gap-3"
			style={{
				animation: `cgpt-msg-in 350ms ease-out ${delay}ms both`,
			}}
		>
			<GptAvatar />
			<div className="w-full max-w-[88%] rounded-2xl rounded-tl-sm border border-[#e5e5e5] bg-white px-4 py-3 text-sm shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
				<p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#aaa]">
					Wine search results
				</p>
				<div className="grid gap-2 sm:grid-cols-3">
					{[
						{
							name: "Rioja Reserva",
							desc: "Cherry, oak — perfect for candlelit dinners",
							highlight: true,
						},
						{
							name: "Chianti Classico",
							desc: "Savory, elegant, food-friendly",
						},
						{ name: "Pinot Noir", desc: "Light body, smooth finish" },
					].map((w) => (
						<div
							key={w.name}
							className={`rounded-xl border p-3 ${
								w.highlight
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
									{w.name}
								</p>
							</div>
							<p className="mt-1 text-[11px] leading-snug text-[#888]">
								{w.desc}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Verification Widget
// ---------------------------------------------------------------------------

type VerifyPhase = "waiting" | "scanning" | "proof" | "done";

function VerificationWidget({
	phase,
	delay = 0,
}: {
	phase: VerifyPhase;
	delay?: number;
}) {
	const WINE = "#722F37";

	const statusText: Record<VerifyPhase, string> = {
		waiting: "Waiting for wallet scan…",
		scanning: "Scanning…",
		proof: "Wallet proof received. Finalizing age verification…",
		done: "Verification succeeded",
	};

	return (
		<div
			className="flex items-start gap-3"
			style={{
				animation: `cgpt-msg-in 350ms ease-out ${delay}ms both`,
			}}
		>
			<GptAvatar />
			<div
				style={{
					background: "#FDF8F3",
					border: `1px solid ${WINE}15`,
					borderRadius: "16px",
					boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
					padding: "16px",
					width: "100%",
					maxWidth: "340px",
				}}
			>
				{/* Header */}
				<div className="mb-3 flex items-center gap-2">
					<ShieldCheck className="h-4 w-4" style={{ color: WINE }} />
					<p className="text-sm font-semibold" style={{ color: WINE }}>
						Checkout Verification
					</p>
				</div>

				{/* QR area */}
				<div
					style={{
						position: "relative",
						background: "#fff",
						border: `2px solid ${WINE}20`,
						borderRadius: "12px",
						padding: "24px",
						overflow: "hidden",
					}}
				>
					<div
						className="flex items-center justify-center"
						style={{ width: "100%", aspectRatio: "1 / 1" }}
					>
						<QrCode
							style={{
								width: "80%",
								height: "80%",
								color: WINE,
								opacity: 0.85,
							}}
							strokeWidth={1}
						/>
					</div>

					{/* Scan line */}
					{(phase === "scanning" || phase === "waiting") && (
						<div
							style={{
								position: "absolute",
								left: 0,
								right: 0,
								height: "2px",
								background: `linear-gradient(90deg, transparent, ${WINE}, transparent)`,
								animation: "cgpt-scan-line 2s linear infinite",
							}}
						/>
					)}

					{/* Success overlay */}
					{phase === "done" && (
						<div
							style={{
								position: "absolute",
								inset: 0,
								background: "rgba(255,255,255,0.88)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								animation: "cgpt-fade-in 300ms ease-out both",
							}}
						>
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: "50%",
									background: "#22c55e",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
									animation:
										"cgpt-check-pop 450ms cubic-bezier(.34,1.56,.64,1) both",
								}}
							>
								<Check className="h-6 w-6 text-white" />
							</div>
						</div>
					)}
				</div>

				{/* Instructions */}
				<div
					style={{
						marginTop: "10px",
						background: `${WINE}08`,
						borderRadius: "8px",
						padding: "8px 10px",
					}}
				>
					<p className="text-xs" style={{ color: "#2D1810" }}>
						Scan this QR code with your{" "}
						<span className="font-semibold">EUDI Wallet app</span>
					</p>
				</div>

				{/* Status */}
				<div className="mt-2.5 flex items-center gap-1.5">
					{phase === "done" ? (
						<CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
					) : (
						<LoaderCircle
							className="h-3.5 w-3.5 animate-spin"
							style={{ color: WINE }}
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
		</div>
	);
}

// ---------------------------------------------------------------------------
// Payment Widget
// ---------------------------------------------------------------------------

type PayPhase = "idle" | "paying" | "done";

function PaymentWidget({
	phase,
	delay = 0,
}: {
	phase: PayPhase;
	delay?: number;
}) {
	const WINE = "#722F37";

	return (
		<div
			className="flex items-start gap-3"
			style={{
				animation: `cgpt-payment-in 400ms ease-out ${delay}ms both`,
			}}
		>
			<GptAvatar />
			<div
				style={{
					background: "linear-gradient(180deg, #fffaf6 0%, #fff 100%)",
					border: `1px solid ${WINE}18`,
					borderRadius: "16px",
					boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
					padding: "16px",
					width: "100%",
					maxWidth: "340px",
				}}
			>
				<div className="mb-3 flex items-center gap-2">
					<CreditCard className="h-4 w-4" style={{ color: WINE }} />
					<p className="text-sm font-semibold" style={{ color: WINE }}>
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
							].map((f) => (
								<div key={f.label}>
									<p
										className="mb-0.5 text-[10px] font-medium uppercase tracking-wide"
										style={{ color: "#999" }}
									>
										{f.label}
									</p>
									<div
										style={{
											background: "#f5f5f5",
											border: "1px solid #e0e0e0",
											borderRadius: "8px",
											padding: "6px 10px",
											fontSize: "13px",
											color: "#555",
										}}
									>
										{f.value}
									</div>
								</div>
							))}
						</div>

						<button
							type="button"
							style={{
								marginTop: "12px",
								width: "100%",
								padding: "9px 0",
								background: phase === "paying" ? "#a05060" : WINE,
								color: "#fff",
								border: "none",
								borderRadius: "999px",
								fontSize: "13px",
								fontWeight: 600,
								cursor: "default",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "6px",
								transition: "background 200ms",
							}}
						>
							{phase === "paying" ? (
								<>
									<LoaderCircle className="h-3.5 w-3.5 animate-spin" />
									Processing…
								</>
							) : (
								"Pay now"
							)}
						</button>
					</>
				) : (
					<div
						style={{
							background: "#eaf7ef",
							border: "1px solid #b6e8c8",
							borderRadius: "10px",
							padding: "12px",
							display: "flex",
							alignItems: "center",
							gap: "8px",
							animation: "cgpt-fade-in 400ms ease-out both",
						}}
					>
						<CheckCircle2 className="h-5 w-5 shrink-0 text-[#22c55e]" />
						<p className="text-sm font-semibold text-[#1a7a46]">
							Payment successful.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChatGptWineMockup() {
	const [step, setStep] = useState(0);
	const [verifyPhase, setVerifyPhase] = useState<VerifyPhase>("waiting");
	const [payPhase, setPayPhase] = useState<PayPhase>("idle");
	const [started, setStarted] = useState(false);
	const sectionRef = useRef<HTMLElement>(null);

	// Start the animation sequence only when the component is visible
	const startRef = useCallback((node: HTMLElement | null) => {
		if (!node) return;
		(sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setStarted(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.15 },
		);
		observer.observe(node);
	}, []);

	useEffect(() => {
		if (!started) return;

		const t = (ms: number, fn: () => void) => window.setTimeout(fn, ms);

		const timers = [
			t(PHASES.msg1, () => setStep(1)),
			t(PHASES.msg2, () => setStep(2)),
			t(PHASES.msg3, () => setStep(3)),
			t(PHASES.tool1Start, () => setStep(4)),
			t(PHASES.tool1Done, () => setStep(5)),
			t(PHASES.msg4, () => setStep(6)),
			t(PHASES.msg5, () => setStep(7)),
			t(PHASES.tool2, () => setStep(8)),
			t(PHASES.msg6, () => setStep(9)),
			t(PHASES.tool3, () => setStep(10)),
			t(PHASES.widget, () => setStep(11)),
			t(PHASES.widgetScan, () => setVerifyPhase("scanning")),
			t(PHASES.widgetProof, () => setVerifyPhase("proof")),
			t(PHASES.widgetDone, () => setVerifyPhase("done")),
			t(PHASES.msg7, () => setStep(12)),
			t(PHASES.payment, () => setStep(13)),
			t(PHASES.paymentPay, () => setPayPhase("paying")),
			t(PHASES.paymentDone, () => setPayPhase("done")),
			t(PHASES.msg8, () => setStep(14)),
		];

		return () => {
			for (const id of timers) window.clearTimeout(id);
		};
	}, [started]);

	return (
		<section
			ref={startRef}
			aria-label="ChatGPT wine conversation mockup"
			className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-[#f5f4f0] shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
		>
			<style>{KEYFRAMES}</style>

			{/* ── Header bar ── */}
			<div className="flex items-center justify-between border-b border-[#e0e0e0] bg-white px-4 py-2.5">
				<div className="flex items-center gap-2">
					{/* macOS dots */}
					<span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
					<span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
					<span className="h-3 w-3 rounded-full bg-[#27c93f]" />
				</div>
				<div className="flex items-center gap-1.5 rounded-lg border border-[#e5e5e5] px-3 py-1 text-sm font-semibold text-[#1a1a1a]">
					ChatGPT
				</div>
				<div className="flex items-center gap-1.5 text-xs text-[#aaa]">
					<Sparkles className="h-3.5 w-3.5" />
					Vinos Wine Store
				</div>
			</div>

			{/* ── Chat body ── */}
			<div className="space-y-4 overflow-hidden bg-[#f5f4f0] px-4 py-5 sm:px-6">
				{step >= 1 && (
					<UserMessage>
						I'd like to buy a wine for a romantic dinner with my wife.
					</UserMessage>
				)}

				{step >= 2 && (
					<AssistantMessage>
						Happy to help! Do you have a style in mind — red, white, sparkling,
						or rosé?
					</AssistantMessage>
				)}

				{step >= 3 && <UserMessage>Red would be nice.</UserMessage>}

				{step >= 4 && (
					<ToolCallRow
						icon={<Sparkles className="h-3.5 w-3.5" />}
						label="search_wines"
						status={step >= 5 ? "done" : "running"}
					/>
				)}

				{step >= 5 && <WineResultsCard />}

				{step >= 6 && (
					<AssistantMessage>
						I found a few great matches. <strong>Rioja Reserva</strong> would be
						perfect for a romantic evening. Want me to add it to your cart?
					</AssistantMessage>
				)}

				{step >= 7 && <UserMessage>Yes, buy the Rioja Reserva.</UserMessage>}

				{step >= 8 && (
					<ToolCallRow
						icon={<ShoppingCart className="h-3.5 w-3.5" />}
						label="add_to_cart"
						status="success"
					/>
				)}

				{step >= 9 && (
					<AssistantMessage>
						Done — Rioja Reserva is in your cart. I'll start checkout now. Since
						this is an age-restricted purchase, you'll need to verify your age.
					</AssistantMessage>
				)}

				{step >= 10 && (
					<ToolCallRow
						icon={<ShoppingCart className="h-3.5 w-3.5" />}
						label="initiate_checkout"
						status="done"
					/>
				)}

				{step >= 11 && <VerificationWidget phase={verifyPhase} />}

				{step >= 12 && (
					<AssistantMessage>
						Age verified! Here's your payment form.
					</AssistantMessage>
				)}

				{step >= 13 && <PaymentWidget phase={payPhase} />}

				{step >= 14 && (
					<AssistantMessage>
						Payment successful! Your <strong>Rioja Reserva</strong> will be
						shipped soon. Enjoy your romantic dinner! 🍷
					</AssistantMessage>
				)}
			</div>

			{/* ── Input bar (decorative) ── */}
			<div className="border-t border-[#e0e0e0] bg-white px-4 py-3">
				<div className="flex items-center gap-2 rounded-xl border border-[#e0e0e0] bg-[#fafafa] px-3.5 py-2 text-sm text-[#bbb]">
					<span className="flex-1">Message ChatGPT</span>
				</div>
			</div>
		</section>
	);
}
