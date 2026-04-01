import type {
	App as McpApp,
	McpUiHostContext,
} from "@modelcontextprotocol/ext-apps";
import {
	useApp,
	useHostStyleVariables,
} from "@modelcontextprotocol/ext-apps/react";
import {
	AlertTriangle,
	CheckCircle2,
	LoaderCircle,
	Shield,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QrCode } from "vidos-web/qr-code";
import type { WidgetToolPayload } from "../lib/types";
import { useWidgetState } from "./useWidgetState";

function QrCodePanel({
	authorizationUrl,
}: {
	authorizationUrl?: string | null;
}) {
	if (!authorizationUrl) {
		return null;
	}

	return (
		<QrCode
			value={authorizationUrl}
			size={220}
			color="#0b5f63"
			className="h-56 w-56 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm"
		/>
	);
}

function BookingScreen({
	app,
	hostContext,
	rawToolOutput,
}: {
	app: McpApp;
	hostContext?: McpUiHostContext;
	rawToolOutput: WidgetToolPayload;
}) {
	const view = useWidgetState(app, rawToolOutput);
	const booking = view.booking;
	const safeAreaStyle = useMemo(
		() => ({
			paddingTop: hostContext?.safeAreaInsets?.top ?? 0,
			paddingRight: hostContext?.safeAreaInsets?.right ?? 0,
			paddingBottom: hostContext?.safeAreaInsets?.bottom ?? 0,
			paddingLeft: hostContext?.safeAreaInsets?.left ?? 0,
		}),
		[hostContext],
	);

	if (!booking) {
		return (
			<div className="p-6 text-sm text-slate-600">
				Waiting for booking data...
			</div>
		);
	}

	const success = booking.status === "approved";
	const failure =
		booking.status === "rejected" ||
		booking.status === "expired" ||
		booking.status === "error";
	const waitingForWallet = booking.verification?.lifecycle === "pending_wallet";
	const authorizationUrl = view.authorizationUrl;

	return (
		<div className="min-h-full text-[var(--foreground)]" style={safeAreaStyle}>
			<div className="mx-auto flex w-full max-w-[42rem] flex-col gap-5 px-4 py-4 sm:px-5 sm:py-6">
				<div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-[0_24px_70px_color-mix(in_oklch,var(--primary)_14%,transparent)]">
					<div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_12%,white)_0%,color-mix(in_oklch,var(--surface)_96%,white)_55%,white_100%)] px-5 py-5 sm:px-6">
						<div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
							<Shield className="h-3.5 w-3.5" />
							Wallet verification
						</div>
						<div>
							<h1 className="text-2xl font-semibold sm:text-[2rem]">
								{booking.selectedVehicle?.name ?? "Car rental booking"}
							</h1>
							<p className="mt-1 text-sm text-[var(--muted-foreground)]">
								{booking.destination} - session{" "}
								{booking.bookingSessionId.slice(0, 8)}
							</p>
							<p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)]">
								This widget handles only the trust step. The rental finishes
								only after the wallet proof is accepted and pickup details
								appear.
							</p>
						</div>
					</div>

					<div className="border-b border-[var(--border)] bg-[color:var(--surface)]/70 px-5 py-4 text-sm sm:px-6">
						<div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
							<p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
								Licence requirement
							</p>
							<p className="mt-2 font-semibold">
								Category {booking.requirements?.requiredLicenceCategory ?? "-"}
							</p>
						</div>
					</div>

					<div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
						{!success && !failure && (
							<div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
								<div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,white_0%,color-mix(in_oklch,var(--surface)_92%,white)_100%)] p-5">
									<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
										{waitingForWallet ? (
											<Shield className="h-3.5 w-3.5" />
										) : (
											<LoaderCircle className="h-3.5 w-3.5 animate-spin" />
										)}
										{waitingForWallet ? "Scan your wallet" : "Processing proof"}
									</div>
									<div className="mt-4 flex min-h-[17rem] items-center justify-center rounded-[22px] border border-dashed border-[var(--border)] bg-white p-4">
										<QrCodePanel authorizationUrl={authorizationUrl} />
									</div>
									<p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
										Open your wallet, scan the QR code, and approve disclosure
										of your mobile driving licence. The agent can confirm the
										rental only after this succeeds.
									</p>
									{authorizationUrl && (
										<a
											href={authorizationUrl}
											target="_blank"
											rel="noreferrer"
											className="mt-4 inline-flex text-sm font-medium text-[var(--primary)] underline underline-offset-4"
										>
											Open wallet link directly
										</a>
									)}
								</div>

								<div className="space-y-4">
									<div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
										<p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
											What is checked
										</p>
										<ul className="mt-3 space-y-3 text-sm text-[var(--foreground)]">
											<li className="rounded-xl bg-[color:var(--surface)] px-3 py-2">
												Licence category{" "}
												{booking.requirements?.requiredLicenceCategory}
											</li>
											<li className="rounded-xl bg-[color:var(--surface)] px-3 py-2">
												Licence expiry validity
											</li>
										</ul>
									</div>
									<div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
										<p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
											Current state
										</p>
										<p className="mt-3 text-lg font-semibold">
											{waitingForWallet
												? "Waiting for wallet approval"
												: "Evaluating disclosed credentials"}
										</p>
										<p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
											{waitingForWallet
												? "No booking confirmation yet. Approval in the wallet is still required."
												: "The proof was received. Eligibility checks are running now."}
										</p>
									</div>
								</div>
							</div>
						)}

						{success && booking.confirmation && booking.eligibility && (
							<div className="space-y-4">
								<div
									className="rounded-[24px] border p-5"
									style={{
										borderColor: "var(--success)",
										background: "var(--success-bg)",
									}}
								>
									<p
										className="text-xs uppercase tracking-[0.16em]"
										style={{ color: "var(--success)" }}
									>
										Proof accepted
									</p>
									<div className="mt-3 flex items-start gap-3">
										<CheckCircle2
											className="mt-1 h-5 w-5 shrink-0"
											style={{ color: "var(--success)" }}
										/>
										<div>
											<h2
												className="text-2xl font-semibold"
												style={{
													color:
														"color-mix(in oklch, var(--success) 72%, black)",
												}}
											>
												Driving licence verified
											</h2>
											<p
												className="mt-2 text-sm leading-relaxed"
												style={{
													color:
														"color-mix(in oklch, var(--success) 58%, black)",
												}}
											>
												Category {booking.eligibility.requiredLicenceCategory}{" "}
												accepted. Presented categories:{" "}
												{booking.eligibility.presentedCategories.join(", ") ||
													"none"}
												.
											</p>
										</div>
									</div>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-[22px] border border-[var(--border)] bg-[color:var(--surface)] p-4">
										<p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
											Booking reference
										</p>
										<p className="mt-2 text-lg font-semibold tracking-[0.02em]">
											{booking.confirmation.bookingReference}
										</p>
										<p className="mt-3 font-mono text-xs text-[var(--muted-foreground)]">
											Locker {booking.confirmation.lockerId} - PIN{" "}
											{booking.confirmation.lockerPin}
										</p>
									</div>
									<div className="rounded-[22px] border border-[var(--border)] bg-[color:var(--surface)] p-4">
										<p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
											Pickup
										</p>
										<p className="mt-2 text-sm font-medium">
											{booking.confirmation.pickupLocation.name}
										</p>
										<p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
											{booking.confirmation.instructions}
										</p>
									</div>
								</div>
							</div>
						)}

						{failure && booking.eligibility && (
							<div
								className="rounded-[24px] border p-5"
								style={{
									borderColor: "var(--danger)",
									background: "var(--danger-bg)",
								}}
							>
								<div className="flex items-start gap-3">
									<AlertTriangle
										className="mt-1 h-5 w-5 shrink-0"
										style={{ color: "var(--danger)" }}
									/>
									<div>
										<p
											className="text-xs uppercase tracking-[0.16em]"
											style={{ color: "var(--danger)" }}
										>
											Verification outcome
										</p>
										<h2
											className="mt-2 text-2xl font-semibold"
											style={{
												color: "color-mix(in oklch, var(--danger) 68%, black)",
											}}
										>
											Booking not approved
										</h2>
										<p
											className="mt-2 text-sm leading-relaxed"
											style={{
												color: "color-mix(in oklch, var(--danger) 58%, black)",
											}}
										>
											{booking.eligibility.reasonText}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export function App() {
	const [rawToolOutput, setRawToolOutput] = useState<WidgetToolPayload>(null);
	const [hostContext, setHostContext] = useState<McpUiHostContext>();
	const { app, error, isConnected } = useApp({
		appInfo: { name: "mcp-car-rental-widget", version: "0.0.1" },
		capabilities: {},
		onAppCreated: (createdApp) => {
			createdApp.ontoolinput = () => {};
			createdApp.ontoolresult = (result) => setRawToolOutput(result);
			createdApp.onhostcontextchanged = (context) => {
				setHostContext((previous) => ({ ...previous, ...context }));
			};
			createdApp.onerror = (appError) => {
				console.error("Rental widget host error", appError);
			};
		},
	});

	useHostStyleVariables(app, hostContext ?? app?.getHostContext());

	useEffect(() => {
		if (app) {
			setHostContext((previous) => ({ ...previous, ...app.getHostContext() }));
		}
	}, [app]);

	if (error) {
		return (
			<div className="p-6 text-sm text-rose-700">
				Unable to connect the rental verification widget to the host.
			</div>
		);
	}

	if (!app || !isConnected) {
		return (
			<div className="p-6 text-sm text-slate-600">
				Connecting rental verification widget...
			</div>
		);
	}

	return (
		<BookingScreen
			app={app}
			hostContext={hostContext ?? app.getHostContext()}
			rawToolOutput={rawToolOutput}
		/>
	);
}
