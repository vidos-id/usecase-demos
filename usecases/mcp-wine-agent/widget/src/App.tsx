import { useEffect, useRef, useState } from "react";
import {
	buildInstructionText,
	buildStatusText,
	isTerminalStatus,
} from "../lib/state";
import { Instructions } from "./components/Instructions";
import { PaymentPanel } from "./components/PaymentPanel";
import { QrSection } from "./components/QrSection";
import { VerificationResult } from "./components/VerificationResult";
import { VinosLogo } from "./components/VinosLogo";
import { useToolOutput } from "./hostStore";
import { useWidgetState } from "./useWidgetState";

export function App() {
	const rawToolOutput = useToolOutput();
	const view = useWidgetState(rawToolOutput);
	const { data, qrSvg, authorizeUrl, sessionId } = view;
	const [paymentCompleted, setPaymentCompleted] = useState(false);
	const notifiedRef = useRef(false);
	const previousSessionRef = useRef<string | null>(sessionId);

	const isTerminal = isTerminalStatus(data.status);
	const isVerified = data.status === "verified" || data.status === "completed";
	const isPaid = paymentCompleted || data.status === "completed";
	const showResult =
		data.status === "verified" ||
		data.status === "completed" ||
		data.status === "rejected" ||
		data.status === "expired" ||
		data.status === "error";
	const showPaymentPanel = isVerified;
	const showQrSection = !showResult;
	const showInstructions = !showResult && !isVerified;

	useEffect(() => {
		if (sessionId && previousSessionRef.current !== sessionId) {
			setPaymentCompleted(false);
			notifiedRef.current = false;
		}

		previousSessionRef.current = sessionId;
	}, [sessionId]);

	function handlePay() {
		setPaymentCompleted(true);
	}

	return (
		<div className="mx-auto flex w-full max-w-[34rem] flex-col gap-6 px-5 py-8">
			<div className="flex flex-col items-center border-b border-[rgba(114,47,55,0.12)] pb-5 pt-2 text-center">
				<div
					className="mx-auto mb-3 flex w-[5rem] items-center justify-center text-[#722f37]"
					aria-hidden="true"
				>
					<VinosLogo />
				</div>
				<h1 className="mb-2 text-2xl font-semibold tracking-tight text-[#722f37]">
					Checkout Verification
				</h1>
				<p className="text-base leading-relaxed text-[rgba(45,24,16,0.62)]">
					Verify your identity to complete your Vinos order
				</p>
			</div>

			{showQrSection && (
				<QrSection qrSvg={qrSvg} statusText={buildStatusText(data)} />
			)}

			{showResult && <VerificationResult data={data} />}

			{showInstructions && (
				<Instructions
					instructionText={buildInstructionText(data)}
					authorizeUrl={authorizeUrl}
					hideLink={isVerified}
				/>
			)}

			{showPaymentPanel && <PaymentPanel onPay={handlePay} isPaid={isPaid} />}

			<div className="pb-2 pt-2 text-center text-[0.65rem] tracking-[0.16em] text-[rgba(45,24,16,0.38)] uppercase">
				Vinos secure checkout powered by Vidos
			</div>
		</div>
	);
}
