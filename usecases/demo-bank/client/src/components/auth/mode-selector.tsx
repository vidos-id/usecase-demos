import type { PresentationMode } from "demo-bank-shared/types/auth";
import { AlertCircle, QrCode, Smartphone } from "lucide-react";
import {
	getDCApiUnsupportedReason,
	isDCApiSupported,
	setStoredMode,
} from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
	value: PresentationMode;
	onChange: (mode: PresentationMode) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
	const dcApiAvailable = isDCApiSupported();
	const dcApiUnavailableReason = getDCApiUnsupportedReason();

	const MODE_OPTIONS = [
		{
			id: "direct_post" as const,
			label: "Mobile Wallet",
			description: "Scan QR code or open deep link",
			tech: "OpenID4VP direct_post",
			Icon: QrCode,
			alwaysAvailable: true,
		},
		{
			id: "dc_api" as const,
			label: "Device Wallet",
			description: "Use your device's built-in wallet",
			tech: "W3C Digital Credentials API",
			Icon: Smartphone,
			alwaysAvailable: false,
			unavailableReason:
				dcApiUnavailableReason ||
				"Requires a browser with Digital Credentials API support (Chrome 128+ on Android)",
		},
	];

	const handleSelect = (mode: PresentationMode) => {
		setStoredMode(mode);
		onChange(mode);
	};

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{MODE_OPTIONS.map((option) => {
				const isAvailable = option.alwaysAvailable || dcApiAvailable;
				const isSelected = value === option.id;
				const Icon = option.Icon;

				return (
					<button
						key={option.id}
						type="button"
						disabled={!isAvailable}
						onClick={() => isAvailable && handleSelect(option.id)}
						className={cn(
							"relative p-4 rounded-xl border-2 text-left transition-all",
							"flex flex-col gap-3",
							isAvailable &&
								"hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
							isSelected
								? "border-primary bg-primary/5 ring-2 ring-primary/20"
								: "border-border/60 bg-background",
							!isAvailable && "opacity-50 cursor-not-allowed",
						)}
					>
						<div className="flex items-start justify-between gap-2">
							<div
								className={cn(
									"h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
									isSelected
										? "bg-primary text-primary-foreground"
										: "bg-muted",
								)}
							>
								<Icon className="h-5 w-5" />
							</div>
							{/* Selected state is indicated by border/ring */}
						</div>

						<div className="space-y-1">
							<span className="font-medium block">{option.label}</span>
							<span className="text-sm text-muted-foreground block">
								{option.description}
							</span>
						</div>

						<div className="pt-1 border-t border-border/40">
							<span className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider">
								{option.tech}
							</span>
						</div>

						{!isAvailable && option.unavailableReason && (
							<div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
								<AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
								<span>{option.unavailableReason}</span>
							</div>
						)}
					</button>
				);
			})}
		</div>
	);
}
