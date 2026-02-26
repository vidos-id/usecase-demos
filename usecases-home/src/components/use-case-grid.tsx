import {
	Car,
	ChevronRight,
	CreditCard,
	FileCheck,
	Fingerprint,
	Plane,
	Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const categories = [
	"All",
	"Core Functionality",
	"Banking & Payment",
	"Health",
	"Travel",
	"Education",
] as const;

interface UseCase {
	title: string;
	description: string;
	category: string;
	icon: React.ReactNode;
	status: "live" | "coming-soon";
}

const useCases: UseCase[] = [
	{
		title: "PID-based Identification",
		description:
			"Secure identification in online services using the PID stored in an EUDI Wallet.",
		category: "Core Functionality",
		icon: <Fingerprint className="size-5" />,
		status: "live",
	},
	{
		title: "eSignature",
		description:
			"Create qualified electronic signatures with the same legal validity as a handwritten signature.",
		category: "Core Functionality",
		icon: <FileCheck className="size-5" />,
		status: "live",
	},
	{
		title: "Mobile Driving Licence",
		description:
			"Prove an individual's right to drive a certain level of vehicle using a verifiable credential.",
		category: "Travel",
		icon: <Car className="size-5" />,
		status: "live",
	},
	{
		title: "Payment Authentication",
		description:
			"Enable online payments to be authenticated via an EUDI Wallet credential.",
		category: "Banking & Payment",
		icon: <CreditCard className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Digital Travel Credential",
		description:
			"A digital representation of an identity document such as a passport or travel document.",
		category: "Travel",
		icon: <Plane className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Age Verification",
		description:
			"Prove you are above a specific age threshold without revealing your full date of birth.",
		category: "Core Functionality",
		icon: <Shield className="size-5" />,
		status: "live",
	},
];

export function UseCaseGrid() {
	return (
		<section id="use-cases" className="section-alt py-20">
			<div className="container-page">
				<p className="mono-label mb-3">Use Cases</p>
				<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Explore the demos
				</h2>
				<p className="mt-3 text-muted-foreground max-w-2xl">
					Each demo walks through a specific EUDI Wallet use case with
					interactive credential flows. Filter by category to find what
					interests you.
				</p>

				{/* Filter chips */}
				<div className="mt-8 flex flex-wrap gap-2">
					{categories.map((cat, i) => (
						<Badge
							key={cat}
							variant={i === 0 ? "default" : "outline"}
							className={
								i === 0
									? "btn-eu-blue border-transparent cursor-pointer"
									: "cursor-pointer hover:bg-accent"
							}
						>
							{cat}
						</Badge>
					))}
				</div>

				{/* Card grid */}
				<div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{useCases.map((uc) => (
						<Card key={uc.title} className="card-hover flex flex-col">
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div className="flex size-10 items-center justify-center rounded-lg bg-eu-blue-light text-eu-blue">
										{uc.icon}
									</div>
									<Badge variant="outline" className="text-xs">
										{uc.category}
									</Badge>
								</div>
								<CardTitle className="mt-3 text-base">{uc.title}</CardTitle>
								<CardDescription className="text-sm">
									{uc.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="mt-auto pt-0">
								<CardFooter className="p-0 flex items-center justify-between">
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<span
											className={`status-dot ${
												uc.status === "live"
													? "status-dot--active"
													: "status-dot--pending"
											}`}
										/>
										{uc.status === "live" ? "Live demo" : "Coming soon"}
									</div>
									{uc.status === "live" && (
										<Button
											variant="ghost"
											size="xs"
											className="text-eu-blue hover:text-eu-blue"
										>
											Try it
											<ChevronRight className="size-3" />
										</Button>
									)}
								</CardFooter>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
