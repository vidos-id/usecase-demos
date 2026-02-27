import {
	CREDENTIAL_FORMAT_SELECTIONS,
	type CredentialFormats,
} from "demo-bank-shared/types/auth";
import { FileBadge2, IdCard, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredentialFormatSelectorProps {
	value: CredentialFormats;
	onChange: (formats: CredentialFormats) => void;
}

const FORMAT_OPTIONS = [
	{
		id: "all" as const,
		formats: CREDENTIAL_FORMAT_SELECTIONS.all,
		label: "Either format",
		description: "Request SD-JWT or mDoc",
		tech: "DCQL credential_sets",
		Icon: Layers,
	},
	{
		id: "sd-jwt" as const,
		formats: CREDENTIAL_FORMAT_SELECTIONS.sdJwtOnly,
		label: "SD-JWT only",
		description: "Request only dc+sd-jwt",
		tech: "No credential_sets",
		Icon: FileBadge2,
	},
	{
		id: "mdoc" as const,
		formats: CREDENTIAL_FORMAT_SELECTIONS.mdocOnly,
		label: "mDoc only",
		description: "Request only mso_mdoc",
		tech: "No credential_sets",
		Icon: IdCard,
	},
];

function areSameFormats(a: readonly string[], b: readonly string[]) {
	return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function CredentialFormatSelector({
	value,
	onChange,
}: CredentialFormatSelectorProps) {
	return (
		<div className="space-y-2.5">
			<div className="flex items-center justify-between gap-3">
				<p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
					Credential format
				</p>
				<p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
					Wallet compatibility
				</p>
			</div>
			<div className="grid grid-cols-1 gap-2">
				{FORMAT_OPTIONS.map((option) => {
					const isSelected = areSameFormats(value, option.formats);
					const Icon = option.Icon;

					return (
						<button
							key={option.id}
							type="button"
							onClick={() => onChange([...option.formats])}
							className={cn(
								"relative rounded-lg border text-left transition-all",
								"px-3 py-2 flex items-start gap-2 h-auto",
								"hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
								isSelected
									? "border-primary bg-primary/5 ring-2 ring-primary/20"
									: "border-border/60 bg-background",
							)}
						>
							<div
								className={cn(
									"h-7 w-7 rounded-md flex items-center justify-center shrink-0 mt-0.5",
									isSelected
										? "bg-primary text-primary-foreground"
										: "bg-muted",
								)}
							>
								<Icon className="h-3.5 w-3.5" />
							</div>

							<div className="flex-1 min-w-0">
								<span className="font-medium block text-xs leading-tight whitespace-nowrap">
									{option.label}
								</span>
								<span className="text-[11px] text-muted-foreground block leading-tight mt-0.5">
									{option.description}
								</span>
								<span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70 block pt-0.5">
									{option.tech}
								</span>
							</div>

							{/* Selected state is indicated by border/ring */}
						</button>
					);
				})}
			</div>
			<p className="text-[11px] leading-relaxed text-muted-foreground">
				"Either format" uses DCQL credential sets (called "complex query" in
				some wallets). Choose a single format if your wallet does not support
				that feature.
			</p>
		</div>
	);
}
