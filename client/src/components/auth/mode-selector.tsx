import type { PresentationMode } from "shared/types/auth";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { isDCApiSupported, setStoredMode } from "@/lib/auth-helpers";

interface ModeSelectorProps {
	value: PresentationMode;
	onChange: (mode: PresentationMode) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
	const dcApiAvailable = isDCApiSupported();

	const handleChange = (newValue: string) => {
		const mode = newValue as PresentationMode;
		setStoredMode(mode);
		onChange(mode);
	};

	return (
		<RadioGroup
			value={value}
			onValueChange={handleChange}
			className="space-y-3"
		>
			<div className="flex items-center space-x-3">
				<RadioGroupItem value="direct_post" id="direct_post" />
				<Label htmlFor="direct_post" className="cursor-pointer">
					<div className="font-medium">QR Code / Deep Link</div>
					<div className="text-sm text-muted-foreground">
						Scan with your wallet app
					</div>
				</Label>
			</div>

			{dcApiAvailable && (
				<div className="flex items-center space-x-3">
					<RadioGroupItem value="dc_api" id="dc_api" />
					<Label htmlFor="dc_api" className="cursor-pointer">
						<div className="font-medium">Browser Wallet</div>
						<div className="text-sm text-muted-foreground">
							Use your browser's built-in wallet
						</div>
					</Label>
				</div>
			)}
		</RadioGroup>
	);
}
