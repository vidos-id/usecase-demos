import {
	Bot,
	CheckCircle2,
	LoaderCircle,
	Paperclip,
	Search,
	Sparkles,
	User,
} from "lucide-react";
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

export type MockupVariant = "chatgpt" | "openclaw";

type ChatMockupStateValue = boolean | null | number | string;
type ChatMockupState = Record<string, ChatMockupStateValue>;
type ToolStatus = "done" | "running" | "success";
type Resolvable<T, TState extends ChatMockupState> =
	| T
	| ((context: ChatMockupRenderContext<TState>) => T);

export type ChatMockupRenderContext<TState extends ChatMockupState> = {
	state: TState;
	variant: MockupVariant;
};

type BaseItem = {
	id: string;
	showAt: number;
	animation?: "message" | "payment";
	delay?: number;
	variant?: MockupVariant | "both";
};

export type ChatMockupItem<TState extends ChatMockupState> =
	| (BaseItem & {
			type: "assistant-message";
			content: Resolvable<ReactNode, TState>;
	  })
	| (BaseItem & {
			type: "custom";
			render: (context: ChatMockupRenderContext<TState>) => ReactNode;
	  })
	| (BaseItem & {
			type: "tool-call";
			doneLabel?: Resolvable<string, TState>;
			icon: Resolvable<ReactNode, TState>;
			label: Resolvable<string, TState>;
			status: Resolvable<ToolStatus, TState>;
			successLabel?: Resolvable<string, TState>;
	  })
	| (BaseItem & {
			type: "user-message";
			content: Resolvable<ReactNode, TState>;
	  });

export type ChatMockupConfig<TState extends ChatMockupState> = {
	ariaLabel: string;
	brandLabel: string;
	initialState: TState;
	inputPlaceholder?: string;
	items: ChatMockupItem<TState>[];
	openClawBrandLabel?: string;
	stateTransitions?: Array<{
		at: number;
		patch: Partial<TState>;
	}>;
	stepTimings: number[];
};

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

function resolveValue<T, TState extends ChatMockupState>(
	value: Resolvable<T, TState>,
	context: ChatMockupRenderContext<TState>,
): T {
	return typeof value === "function"
		? (value as (context: ChatMockupRenderContext<TState>) => T)(context)
		: value;
}

function getAssistantBubbleStyle(
	variant: MockupVariant,
): CSSProperties | undefined {
	if (variant !== "openclaw") {
		return undefined;
	}

	return {
		background: "#ffffff",
		border: "1px solid #d9e7f1",
		boxShadow: "0 1px 3px rgba(27, 78, 111, 0.08)",
	};
}

function getUserBubbleStyle(variant: MockupVariant): CSSProperties | undefined {
	if (variant !== "openclaw") {
		return undefined;
	}

	return {
		background: "#dff4ff",
		border: "1px solid #c8e7f9",
		boxShadow: "0 1px 3px rgba(27, 78, 111, 0.08)",
	};
}

function AgentAvatar({ variant }: { variant: MockupVariant }) {
	return (
		<div
			className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
			style={{
				background: variant === "openclaw" ? "#2AABEE" : "#10a37f",
			}}
		>
			{variant === "openclaw" ? (
				<span className="text-[13px] leading-none">🦞</span>
			) : (
				<Bot className="h-4 w-4 text-white" />
			)}
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

function AnimatedRow({
	animation = "message",
	children,
	delay = 0,
}: {
	animation?: "message" | "payment";
	children: ReactNode;
	delay?: number;
}) {
	return (
		<div
			style={{
				animation:
					animation === "payment"
						? `cgpt-payment-in 400ms ease-out ${delay}ms both`
						: `cgpt-msg-in 350ms ease-out ${delay}ms both`,
			}}
		>
			{children}
		</div>
	);
}

function AssistantMessage({
	children,
	variant,
	animation,
	delay,
}: {
	children: ReactNode;
	variant: MockupVariant;
	animation?: "message" | "payment";
	delay?: number;
}) {
	const isOpenClaw = variant === "openclaw";

	return (
		<AnimatedRow animation={animation} delay={delay}>
			<div className="flex items-start gap-3">
				<AgentAvatar variant={variant} />
				<div
					className={
						isOpenClaw
							? "max-w-[85%] rounded-[18px] rounded-bl-[6px] px-4 py-2.5 text-sm text-[#1a1a1a]"
							: "max-w-[85%] rounded-2xl rounded-tl-sm border border-[#e5e5e5] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
					}
					style={getAssistantBubbleStyle(variant)}
				>
					{children}
				</div>
			</div>
		</AnimatedRow>
	);
}

function UserMessage({
	children,
	variant,
	animation,
	delay,
}: {
	children: ReactNode;
	variant: MockupVariant;
	animation?: "message" | "payment";
	delay?: number;
}) {
	const isOpenClaw = variant === "openclaw";

	return (
		<AnimatedRow animation={animation} delay={delay}>
			<div className="flex items-start justify-end gap-3">
				<div
					className={
						isOpenClaw
							? "max-w-[80%] rounded-[18px] rounded-br-[6px] px-4 py-2.5 text-sm text-[#123247]"
							: "max-w-[80%] rounded-2xl rounded-tr-sm bg-[#f4f4f4] px-4 py-2.5 text-sm text-[#1a1a1a]"
					}
					style={getUserBubbleStyle(variant)}
				>
					{children}
				</div>
				<UserAvatar />
			</div>
		</AnimatedRow>
	);
}

function ToolCallRow({
	doneLabel,
	icon,
	label,
	status,
	successLabel,
	variant,
	animation,
	delay,
}: {
	doneLabel?: string;
	icon: ReactNode;
	label: string;
	status: ToolStatus;
	successLabel?: string;
	variant: MockupVariant;
	animation?: "message" | "payment";
	delay?: number;
}) {
	const isOpenClaw = variant === "openclaw";

	return (
		<AnimatedRow animation={animation} delay={delay}>
			<div className="flex items-start gap-3">
				<AgentAvatar variant={variant} />
				<div
					className={
						isOpenClaw
							? "flex items-center gap-2 rounded-[18px] rounded-bl-[6px] border px-3.5 py-2 text-xs text-[#46667b]"
							: "flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[#e5e5e5] bg-white px-3.5 py-2 text-xs text-[#555] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
					}
					style={getAssistantBubbleStyle(variant)}
				>
					<span
						className={isOpenClaw ? "text-[#2AABEE]" : "text-[#10a37f]"}
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
							{doneLabel ?? "Complete"}
						</span>
					)}
					{status === "success" && (
						<span className="flex items-center gap-1 rounded-full bg-[#eaf7ef] px-2 py-0.5 text-[10px] text-[#1a7a46]">
							<CheckCircle2 className="h-3 w-3" />
							{successLabel ?? "Done"}
						</span>
					)}
				</div>
			</div>
		</AnimatedRow>
	);
}

export function MockupAssistantRow({
	children,
	variant,
	animation,
	delay,
}: {
	children: ReactNode;
	variant: MockupVariant;
	animation?: "message" | "payment";
	delay?: number;
}) {
	return (
		<AnimatedRow animation={animation} delay={delay}>
			<div className="flex items-start gap-3">
				<AgentAvatar variant={variant} />
				{children}
			</div>
		</AnimatedRow>
	);
}

function isVisibleForVariant(
	itemVariant: MockupVariant | "both" | undefined,
	variant: MockupVariant,
) {
	if (!itemVariant || itemVariant === "both") {
		return true;
	}

	return itemVariant === variant;
}

export function AnimatedChatMockup<TState extends ChatMockupState>({
	config,
	variant = "chatgpt",
}: {
	config: ChatMockupConfig<TState>;
	variant?: MockupVariant;
}) {
	const [started, setStarted] = useState(false);
	const [step, setStep] = useState(0);
	const [state, setState] = useState<TState>(config.initialState);
	const sectionRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		setStep(0);
		setStarted(false);
		setState(config.initialState);
	}, [config]);

	useEffect(() => {
		const node = sectionRef.current;
		if (!node || started) {
			return;
		}

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

		return () => {
			observer.disconnect();
		};
	}, [started]);

	useEffect(() => {
		if (!started) {
			return;
		}

		const timers = [
			...config.stepTimings.map((timing, index) =>
				window.setTimeout(() => setStep(index + 1), timing),
			),
			...(config.stateTransitions ?? []).map(({ at, patch }) =>
				window.setTimeout(() => {
					setState((current) => ({
						...current,
						...patch,
					}));
				}, at),
			),
		];

		return () => {
			for (const timer of timers) {
				window.clearTimeout(timer);
			}
		};
	}, [config.stateTransitions, config.stepTimings, started]);

	const context = useMemo(() => ({ state, variant }), [state, variant]);

	const isOpenClaw = variant === "openclaw";
	const visibleItems = config.items.filter(
		(item) => item.showAt <= step && isVisibleForVariant(item.variant, variant),
	);

	return (
		<section
			ref={sectionRef}
			aria-label={`${isOpenClaw ? "OpenClaw" : "ChatGPT"} ${config.ariaLabel}`}
			className="overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
			style={{
				border: isOpenClaw ? "1px solid #c9ddeb" : "1px solid #e5e5e5",
				background: isOpenClaw ? "#e7f1f8" : "#f5f4f0",
			}}
		>
			<style>{KEYFRAMES}</style>

			<div
				className="flex items-center justify-between px-4 py-2.5"
				style={{
					borderBottom: isOpenClaw ? "1px solid #c9ddeb" : "1px solid #e0e0e0",
					background: isOpenClaw ? "#5faee3" : "#ffffff",
				}}
			>
				{isOpenClaw ? (
					<>
						<div className="flex items-center gap-3 text-white">
							<Search className="h-4 w-4 opacity-90" />
							<div className="flex items-center gap-2">
								<span className="text-base leading-none">🦞</span>
								<div>
									<p className="text-sm font-semibold leading-none">OpenClaw</p>
									<p className="mt-1 text-[11px] leading-none text-white/80">
										{config.openClawBrandLabel ?? config.brandLabel}
									</p>
								</div>
							</div>
						</div>
						<Paperclip className="h-4 w-4 text-white/90" />
					</>
				) : (
					<>
						<div className="flex items-center gap-2">
							<span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
							<span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
							<span className="h-3 w-3 rounded-full bg-[#27c93f]" />
						</div>
						<div className="flex items-center gap-1.5 rounded-lg border border-[#e5e5e5] px-3 py-1 text-sm font-semibold text-[#1a1a1a]">
							ChatGPT
						</div>
						<div className="flex items-center gap-1.5 text-xs text-[#aaa]">
							<Sparkles className="h-3.5 w-3.5" />
							{config.brandLabel}
						</div>
					</>
				)}
			</div>

			<div
				className="space-y-4 overflow-hidden px-4 py-5 sm:px-6"
				style={{ background: isOpenClaw ? "#e7f1f8" : "#f5f4f0" }}
			>
				{visibleItems.map((item) => {
					switch (item.type) {
						case "assistant-message":
							return (
								<AssistantMessage
									key={item.id}
									variant={variant}
									animation={item.animation}
									delay={item.delay}
								>
									{resolveValue(item.content, context)}
								</AssistantMessage>
							);
						case "custom":
							return <div key={item.id}>{item.render(context)}</div>;
						case "tool-call":
							return (
								<ToolCallRow
									key={item.id}
									variant={variant}
									animation={item.animation}
									delay={item.delay}
									icon={resolveValue(item.icon, context)}
									label={resolveValue(item.label, context)}
									status={resolveValue(item.status, context)}
									doneLabel={
										item.doneLabel
											? resolveValue(item.doneLabel, context)
											: undefined
									}
									successLabel={
										item.successLabel
											? resolveValue(item.successLabel, context)
											: undefined
									}
								/>
							);
						case "user-message":
							return (
								<UserMessage
									key={item.id}
									variant={variant}
									animation={item.animation}
									delay={item.delay}
								>
									{resolveValue(item.content, context)}
								</UserMessage>
							);
						default:
							return null;
					}
				})}
			</div>

			<div
				className="px-4 py-3"
				style={{
					borderTop: isOpenClaw ? "1px solid #c9ddeb" : "1px solid #e0e0e0",
					background: isOpenClaw ? "#f1f7fb" : "#ffffff",
				}}
			>
				<div
					className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm"
					style={{
						border: isOpenClaw ? "1px solid #d5e6f1" : "1px solid #e0e0e0",
						background: isOpenClaw ? "#ffffff" : "#fafafa",
						color: isOpenClaw ? "#7d98aa" : "#bbb",
					}}
				>
					<span className="flex-1">
						{config.inputPlaceholder ??
							(isOpenClaw ? "Message OpenClaw" : "Message ChatGPT")}
					</span>
				</div>
			</div>
		</section>
	);
}
