import { ArrowRight, Download, Play, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
	{
		number: "1",
		icon: <Download className="size-5" />,
		title: "Get a Wallet",
		description:
			"Download a compatible EUDI Wallet app. We support the EU Reference Wallet, Valera, and other standards-compliant wallets.",
	},
	{
		number: "2",
		icon: <Wallet className="size-5" />,
		title: "Obtain Credentials",
		description:
			"Issue yourself test credentials through our guided issuance flow. Get a PID, driving licence, or other verifiable credentials.",
	},
	{
		number: "3",
		icon: <Play className="size-5" />,
		title: "Try the Demos",
		description:
			"Walk through interactive scenarios that demonstrate real-world credential verification flows end-to-end.",
	},
];

export function HowItWorks() {
	return (
		<section id="how-it-works" className="py-20 lg:py-24">
			<div className="container-page max-w-4xl mx-auto">
				<div className="text-center mb-16">
					<p className="mono-label mb-3">Getting Started</p>
					<h2 className="heading-mixed">
						Who is this information <strong>for?</strong>
					</h2>
					<p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
						These demos are designed to help wallet providers, issuers,
						verifiers, and developers explore EUDI Wallet use cases.
					</p>
				</div>

				{/* Steps — three column cards with numbered EU-blue circles */}
				<div className="grid gap-6 sm:grid-cols-3">
					{steps.map((step) => (
						<div
							key={step.number}
							className="relative rounded-xl border bg-card p-8 text-center flex flex-col items-center"
						>
							{/* Number circle */}
							<div className="flex size-12 items-center justify-center rounded-full bg-eu-blue text-eu-blue-foreground text-lg font-bold">
								{step.number}
							</div>

							{/* Icon */}
							<div className="mt-4 flex size-10 items-center justify-center rounded-lg bg-eu-blue-light text-eu-blue">
								{step.icon}
							</div>

							<h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
							<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
								{step.description}
							</p>
						</div>
					))}
				</div>

				{/* Connecting line between steps (desktop) */}
				<div className="hidden sm:flex justify-center mt-[-13.5rem] mb-[10rem] pointer-events-none">
					<div className="w-[60%] border-t-2 border-dashed border-eu-blue/20" />
				</div>

				<div className="mt-12 text-center">
					<Button className="btn-eu-blue" size="lg">
						Get Started
						<ArrowRight className="size-4" />
					</Button>
				</div>
			</div>
		</section>
	);
}
