import type {
	App as McpApp,
	McpUiHostContext,
} from "@modelcontextprotocol/ext-apps";
import {
	useApp,
	useHostStyleVariables,
} from "@modelcontextprotocol/ext-apps/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	buildInstructionText,
	buildStatusText,
	isTerminalStatus,
} from "../lib/state";
import type { WidgetToolPayload } from "../lib/types";
import { Instructions } from "./components/Instructions";
import { PaymentPanel } from "./components/PaymentPanel";
import { QrSection } from "./components/QrSection";
import { VerificationResult } from "./components/VerificationResult";
import { VinosLogo } from "./components/VinosLogo";
import { useWidgetState } from "./useWidgetState";

type ScreenProps = {
	app: McpApp;
	hostContext?: McpUiHostContext;
	rawToolOutput: WidgetToolPayload;
};

function CheckoutVerificationScreen({
	app,
	hostContext,
	rawToolOutput,
}: ScreenProps) {
	const view = useWidgetState(app, rawToolOutput);
	const { data, qrSvg, authorizeUrl, sessionId } = view;
	const [paymentCompleted, setPaymentCompleted] = useState(false);
	const notifiedRef = useRef(false);
	const previousSessionRef = useRef<string | null>(sessionId);
	const safeAreaStyle = useMemo(
		() => ({
			paddingTop: hostContext?.safeAreaInsets?.top ?? 0,
			paddingRight: hostContext?.safeAreaInsets?.right ?? 0,
			paddingBottom: hostContext?.safeAreaInsets?.bottom ?? 0,
			paddingLeft: hostContext?.safeAreaInsets?.left ?? 0,
		}),
		[hostContext],
	);

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

	const handleOpenWallet = useCallback(async () => {
		if (!authorizeUrl) {
			return;
		}

		await app.openLink({ url: authorizeUrl });
	}, [app, authorizeUrl]);

	return (
		<div className="w-full" style={safeAreaStyle}>
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
						onOpenWallet={handleOpenWallet}
					/>
				)}

				{showPaymentPanel && <PaymentPanel onPay={handlePay} isPaid={isPaid} />}

				<div className="pb-2 pt-2 text-center text-[0.65rem] tracking-[0.16em] text-[rgba(45,24,16,0.38)] uppercase">
					Vinos secure checkout powered by Vidos
				</div>
			</div>
		</div>
	);
}

export function App() {
	const [rawToolOutput, setRawToolOutput] = useState<WidgetToolPayload>(null);
	const [hostContext, setHostContext] = useState<McpUiHostContext>();
	const { app, error, isConnected } = useApp({
		appInfo: {
			name: "mcp-wine-agent-verification-widget",
			version: "0.0.1",
		},
		capabilities: {},
		onAppCreated: (createdApp) => {
			createdApp.ontoolinput = () => {};
			createdApp.ontoolresult = (result) => {
				setRawToolOutput(result);
			};
			createdApp.onhostcontextchanged = (context) => {
				setHostContext((previous) => ({ ...previous, ...context }));
			};
			createdApp.onteardown = async () => {
				return {};
			};
			createdApp.onerror = (appError) => {
				console.error("Verification widget host error", appError);
			};
		},
	});

	useHostStyleVariables(app, hostContext ?? app?.getHostContext());

	useEffect(() => {
		if (app) {
			setHostContext((previous) => ({
				...previous,
				...app.getHostContext(),
			}));
		}
	}, [app]);

	if (error) {
		return (
			<div className="mx-auto flex min-h-full w-full max-w-[34rem] items-center justify-center px-5 py-8">
				<div className="w-full rounded-2xl border border-[#e4c6c9] bg-[#fff7f6] p-6 text-center text-sm leading-relaxed text-[#7a1a14] shadow-[0_14px_40px_rgba(122,26,20,0.08)]">
					Unable to connect the verification widget to the host.
				</div>
			</div>
		);
	}

	if (!app || !isConnected) {
		return (
			<div className="mx-auto flex min-h-full w-full max-w-[34rem] items-center justify-center px-5 py-8">
				<div className="w-full rounded-2xl border border-[rgba(114,47,55,0.12)] bg-white/90 p-6 text-center text-sm leading-relaxed text-[rgba(45,24,16,0.72)] shadow-[0_14px_40px_rgba(114,47,55,0.08)]">
					Connecting verification widget...
				</div>
			</div>
		);
	}

	return (
		<CheckoutVerificationScreen
			app={app}
			hostContext={hostContext ?? app.getHostContext()}
			rawToolOutput={rawToolOutput}
		/>
	);
}
