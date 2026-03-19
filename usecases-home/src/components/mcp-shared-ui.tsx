import {
	ArrowRight,
	Bot,
	Check,
	CheckCircle2,
	Copy,
	ExternalLink,
	FileText,
	MessageSquare,
	QrCode,
	ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

export const chatgptUrls = {
	advanced: "https://chatgpt.com/#settings/Connectors/Advanced",
	connectors: "https://chatgpt.com/#settings/Connectors",
	home: "https://chatgpt.com/",
	settings: "https://chatgpt.com/#settings",
} as const;

export const usageModes = [
	{
		id: "chatgpt" as const,
		label: "ChatGPT via MCP",
		icon: <Bot className="h-4 w-4" />,
	},
	{
		id: "openclaw" as const,
		label: "OpenClaw via API",
		icon: <span>🦞</span>,
	},
] as const;

export type UsageModeId = (typeof usageModes)[number]["id"];

export function ExternalAnchor({
	href,
	children,
	className = "",
}: {
	href: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={[
				"inline-flex items-center gap-1.5 text-eu-blue underline underline-offset-2 hover:text-eu-blue-dark transition-colors",
				className,
			].join(" ")}
		>
			{children}
			<ExternalLink className="h-3.5 w-3.5" />
			<span className="sr-only">Opens in new tab</span>
		</a>
	);
}

export function StepItem({
	number,
	children,
}: {
	number: number;
	children: React.ReactNode;
}) {
	return (
		<li className="flex gap-3">
			<span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-mono font-bold text-muted-foreground shrink-0">
				{number}
			</span>
			<span className="text-foreground/80">{children}</span>
		</li>
	);
}

export function CopyableField({
	value,
	label,
}: {
	value: string;
	label: string;
}) {
	const [copied, setCopied] = useState(false);

	const copyValue = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div className="mt-2 rounded-xl border border-border/60 bg-muted/60 px-3 py-3">
			<div className="flex items-start gap-3">
				<p className="min-w-0 flex-1 break-all font-mono text-sm text-foreground">
					{value}
				</p>
				<button
					type="button"
					onClick={copyValue}
					aria-label={`Copy ${label}`}
					className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:border-eu-blue/40 hover:text-eu-blue"
				>
					{copied ? (
						<Check className="h-4 w-4 text-green-600" />
					) : (
						<Copy className="h-4 w-4" />
					)}
				</button>
			</div>
		</div>
	);
}

export function SetupCard({
	label,
	value,
	description,
}: {
	label: string;
	value?: string;
	description: string;
}) {
	return (
		<div className="rounded-2xl border border-border/60 bg-background p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
			<p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
				{label}
			</p>
			{value ? (
				<CopyableField value={value} label={label} />
			) : (
				<p className="mt-2 text-sm italic text-muted-foreground/70">
					No value needed
				</p>
			)}
			<p className="mt-3 text-sm text-muted-foreground leading-relaxed">
				{description}
			</p>
		</div>
	);
}

export function JourneyStep({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="rounded-2xl border border-border/60 bg-card p-4">
			<div className="flex items-start gap-3">
				<div className="h-10 w-10 rounded-xl bg-eu-blue-light flex items-center justify-center text-eu-blue shrink-0">
					{icon}
				</div>
				<div>
					<h3 className="font-semibold">{title}</h3>
					<p className="mt-1 text-sm text-muted-foreground leading-relaxed">
						{description}
					</p>
				</div>
			</div>
		</div>
	);
}

export function UsageModeTabs({
	activeMode,
	onChange,
}: {
	activeMode: UsageModeId;
	onChange: (mode: UsageModeId) => void;
}) {
	return (
		<div>
			<p className="mono-label mb-4">Choose your flow</p>
			<div className="flex gap-2 rounded-xl border border-border/60 bg-muted/50 p-1 w-fit">
				{usageModes.map((mode) => (
					<button
						key={mode.id}
						type="button"
						onClick={() => onChange(mode.id)}
						className={cn(
							"flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
							activeMode === mode.id
								? "bg-background border border-border/60 shadow-sm text-eu-blue"
								: "text-muted-foreground hover:bg-background/50",
						)}
					>
						{mode.icon}
						{mode.label}
					</button>
				))}
			</div>
		</div>
	);
}

export function RelatedGuides({
	credentialDescription = "Issue the credential needed for the verification widget.",
}: {
	credentialDescription?: string;
}) {
	return (
		<section className="pt-4 border-t border-border/40">
			<p className="mono-label mb-3">Related guides</p>
			<div className="grid gap-4 sm:grid-cols-2">
				<a
					href="/wallet-setup"
					className="group flex items-center justify-between rounded-xl border border-border/60 p-5 transition-colors hover:border-eu-blue/40"
				>
					<div>
						<p className="font-semibold">Wallet Setup</p>
						<p className="mt-0.5 text-sm text-muted-foreground">
							Install a compatible wallet for the verification step.
						</p>
					</div>
					<ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-eu-blue" />
				</a>
				<a
					href="/credential-prep"
					className="group flex items-center justify-between rounded-xl border border-border/60 p-5 transition-colors hover:border-eu-blue/40"
				>
					<div>
						<p className="font-semibold">Credential Preparation</p>
						<p className="mt-0.5 text-sm text-muted-foreground">
							{credentialDescription}
						</p>
					</div>
					<ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-eu-blue" />
				</a>
			</div>
		</section>
	);
}

export { Bot, CheckCircle2, FileText, MessageSquare, QrCode, ShoppingCart };
