import { FileX, Globe, Zap } from "lucide-react";

const blueAccent = "var(--primary)";

interface Pillar {
	icon: React.ReactNode;
	headline: string;
	sub: string;
}

const pillars: Pillar[] = [
	{
		icon: <FileX className="size-7" />,
		headline: "No paper. No queues.",
		sub: "Customers prove identity in seconds — no forms, no photocopies, no manual checks.",
	},
	{
		icon: <Zap className="size-7" />,
		headline: "Instant verification.",
		sub: "Every credential is validated cryptographically in real time, with zero human error.",
	},
	{
		icon: <Globe className="size-7" />,
		headline: "EU-compliant identity.",
		sub: "Built on the EUDI Wallet standard (eIDAS 2.0). Trusted across all EU member states.",
	},
];

function PillarCard({ pillar }: { pillar: Pillar }) {
	return (
		<div
			className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card px-8 py-7"
			style={{ borderTopWidth: "3px", borderTopColor: blueAccent }}
		>
			<div
				className="flex size-12 items-center justify-center rounded-xl"
				style={{ background: `${blueAccent}10`, color: blueAccent }}
			>
				{pillar.icon}
			</div>
			<div>
				<p className="font-heading mb-1.5 text-xl font-extrabold tracking-tight">
					{pillar.headline}
				</p>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{pillar.sub}
				</p>
			</div>
		</div>
	);
}

export function PillarsSection() {
	return (
		<section
			className="border-y border-border/50 py-20"
			style={{
				background: `linear-gradient(to bottom, ${blueAccent}05, transparent)`,
			}}
		>
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<div className="mb-12 text-center">
					<p
						className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest"
						style={{ color: blueAccent }}
					>
						Why it matters
					</p>
					<h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
						Built for the modern fleet operator.
					</h2>
				</div>

				<div className="grid gap-5 sm:grid-cols-3">
					{pillars.map((pillar) => (
						<PillarCard key={pillar.headline} pillar={pillar} />
					))}
				</div>
			</div>
		</section>
	);
}
