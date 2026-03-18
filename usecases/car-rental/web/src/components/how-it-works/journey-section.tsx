import {
	CalendarCheck,
	Car,
	CheckCircle2,
	IdCard,
	QrCode,
	ShieldCheck,
} from "lucide-react";

const blueAccent = "var(--primary)";

interface JourneyStep {
	number: number;
	icon: React.ReactNode;
	title: string;
	description: string;
}

const journeySteps: JourneyStep[] = [
	{
		number: 1,
		icon: <CalendarCheck className="size-6" />,
		title: "Book online",
		description: "Choose a car. No account, no forms, no friction.",
	},
	{
		number: 2,
		icon: <IdCard className="size-6" />,
		title: "Identity check requested",
		description: "We ask for a digital licence and ID — nothing more.",
	},
	{
		number: 3,
		icon: <QrCode className="size-6" />,
		title: "Scan & share",
		description: "Customer scans a QR code with their EU Digital Wallet.",
	},
	{
		number: 4,
		icon: <ShieldCheck className="size-6" />,
		title: "Instant verification",
		description: "Credentials are validated cryptographically in milliseconds.",
	},
	{
		number: 5,
		icon: <Car className="size-6" />,
		title: "Pickup confirmed",
		description: "Agent confirms the booking attestation at the counter.",
	},
	{
		number: 6,
		icon: <CheckCircle2 className="size-6" />,
		title: "Keys handed over",
		description: "Zero paper. Zero queues. Fully compliant.",
	},
];

function JourneyCard({ step }: { step: JourneyStep }) {
	return (
		<div
			className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-md"
			style={{ borderTopColor: `${blueAccent}30` }}
		>
			<div
				className="pointer-events-none absolute -right-2 -top-3 select-none font-heading text-8xl font-black leading-none opacity-[0.045]"
				style={{ color: blueAccent }}
				aria-hidden="true"
			>
				{step.number}
			</div>

			<div
				className="mb-4 flex size-12 items-center justify-center rounded-xl"
				style={{
					background: `${blueAccent}12`,
					border: `1px solid ${blueAccent}28`,
					color: blueAccent,
				}}
			>
				{step.icon}
			</div>

			<p
				className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-widest"
				style={{ color: blueAccent }}
			>
				Step {step.number}
			</p>

			<h3 className="font-heading mb-2 text-base font-bold tracking-tight">
				{step.title}
			</h3>
			<p className="text-sm leading-relaxed text-muted-foreground">
				{step.description}
			</p>
		</div>
	);
}

export function JourneySection() {
	return (
		<section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
			<div className="mb-12 text-center">
				<p
					className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest"
					style={{ color: blueAccent }}
				>
					The experience
				</p>
				<h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
					Six steps. Under two minutes.
				</h2>
				<p className="mt-3 text-base text-muted-foreground">
					From booking to driving away — entirely digital.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{journeySteps.map((step) => (
					<JourneyCard key={step.number} step={step} />
				))}
			</div>
		</section>
	);
}
