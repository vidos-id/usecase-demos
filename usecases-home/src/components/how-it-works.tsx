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
			"Walk through interactive use case scenarios that demonstrate real-world credential verification flows.",
	},
];

export function HowItWorks() {
	return (
		<section id="how-it-works" className="py-20">
			<div className="container-page">
				<div className="text-center mb-14">
					<p className="mono-label mb-3">Getting Started</p>
					<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
						How it works
					</h2>
					<p className="mt-3 text-muted-foreground max-w-xl mx-auto">
						Three steps to start exploring the EUDI Wallet use case demos.
					</p>
				</div>

				<div className="grid gap-8 sm:grid-cols-3">
					{steps.map((step) => (
						<div key={step.number} className="text-center">
							<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
								{step.number}
							</div>
							<div className="mt-2 flex justify-center text-muted-foreground">
								{step.icon}
							</div>
							<h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
							<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
								{step.description}
							</p>
						</div>
					))}
				</div>

				<div className="mt-14 text-center">
					<Button className="btn-eu-blue" size="lg">
						Get Started
						<ArrowRight className="size-4" />
					</Button>
				</div>
			</div>
		</section>
	);
}
