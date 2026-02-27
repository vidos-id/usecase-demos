import {
	ChevronRight,
	GraduationCap,
	Heart,
	ParkingCircle,
	Pill,
	Plane,
	Scale,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import ageIllustration from "../assets/age-verification-illustration.svg";
import bankIllustration from "../assets/bank-illustration.svg";
import mdlIllustration from "../assets/mdl-illustration.svg";
import passportIllustration from "../assets/passport-illustration.svg";

const categories = [
	"All",
	"Core Functionality",
	"Banking & Payment",
	"Travel",
	"Education",
	"Health & Social Security",
] as const;

interface FeaturedUseCase {
	title: string;
	description: string;
	category: string;
	illustration: string;
	status: "live" | "coming-soon";
}

interface SecondaryUseCase {
	title: string;
	description: string;
	category: string;
	icon: React.ReactNode;
	status: "live" | "coming-soon";
}

const featured: FeaturedUseCase[] = [
	{
		title: "Banking Sign-up with Personal ID",
		description:
			"Open a bank account using your EUDI Wallet. Present your PID credential to verify your identity instantly — no paperwork, no branch visit.",
		category: "Banking & Payment",
		illustration: bankIllustration,
		status: "live",
	},
	{
		title: "Car Rental with Mobile Driving Licence",
		description:
			"Rent a car by presenting your mobile driving licence from your EUDI Wallet. The rental agency verifies your licence category and validity in seconds.",
		category: "Travel",
		illustration: mdlIllustration,
		status: "live",
	},
	{
		title: "Age Verification",
		description:
			"Prove you are above a required age threshold without revealing your full date of birth. Selective disclosure keeps your data minimal.",
		category: "Core Functionality",
		illustration: ageIllustration,
		status: "live",
	},
	{
		title: "Digital Travel Credential",
		description:
			"Present a digital version of your passport or travel document at airport gates. Contactless, fast, and cryptographically verified.",
		category: "Travel",
		illustration: passportIllustration,
		status: "coming-soon",
	},
];

const secondary: SecondaryUseCase[] = [
	{
		title: "e-Prescription",
		description:
			"Identify yourself in order to access e-prescriptions stored and presented via an EUDI Wallet.",
		category: "Health & Social Security",
		icon: <Pill className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Natural or legal person representation",
		description:
			"Enables users to act on behalf of another individual or an organisation using digitally verifiable credentials.",
		category: "Legal representation",
		icon: <Scale className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Educational Credentials",
		description:
			"Store, manage, and present digitally verifiable education-related credentials, like diplomas and certificates.",
		category: "Education",
		icon: <GraduationCap className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "European Disability Card",
		description:
			"Serves as proof of recognised disability status and entitlement to disability services.",
		category: "Health & Social Security",
		icon: <Heart className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "European Parking Card (EPC)",
		description:
			"Issued to persons with disabilities, recognising the right to certain reserved parking conditions and facilities.",
		category: "Travel",
		icon: <ParkingCircle className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Digital Travel Credential (DTC)",
		description:
			"A digital representation of the user's identity document such as an identity card, passport or another travel document.",
		category: "Travel",
		icon: <Plane className="size-5" />,
		status: "coming-soon",
	},
];

function FeaturedCard({ uc }: { uc: FeaturedUseCase }) {
	return (
		<Card className="card-hover overflow-hidden flex flex-col">
			<div className="bg-surface-raised flex items-center justify-center p-6 border-b">
				<img
					src={uc.illustration}
					alt={uc.title}
					className="h-40 w-auto object-contain"
				/>
			</div>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between gap-2">
					<Badge variant="outline" className="text-xs shrink-0">
						{uc.category}
					</Badge>
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<span
							className={`status-dot ${
								uc.status === "live"
									? "status-dot--active"
									: "status-dot--pending"
							}`}
						/>
						{uc.status === "live" ? "Live" : "Soon"}
					</div>
				</div>
				<CardTitle className="text-lg mt-2">{uc.title}</CardTitle>
				<CardDescription>{uc.description}</CardDescription>
			</CardHeader>
			<CardFooter className="mt-auto pt-0">
				{uc.status === "live" ? (
					<Button
						variant="ghost"
						size="sm"
						className="text-eu-blue hover:text-eu-blue -ml-2"
					>
						Try this demo
						<ChevronRight className="size-4" />
					</Button>
				) : (
					<span className="text-xs text-muted-foreground">Coming soon</span>
				)}
			</CardFooter>
		</Card>
	);
}

function SecondaryCard({ uc }: { uc: SecondaryUseCase }) {
	return (
		<Card className="card-hover flex items-start gap-4 p-4">
			<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-eu-blue-light text-eu-blue">
				{uc.icon}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between gap-2">
					<h3 className="text-sm font-semibold truncate">{uc.title}</h3>
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
						<span
							className={`status-dot ${
								uc.status === "live"
									? "status-dot--active"
									: "status-dot--pending"
							}`}
						/>
						{uc.status === "live" ? "Live" : "Soon"}
					</div>
				</div>
				<p className="text-sm text-muted-foreground mt-1">{uc.description}</p>
			</div>
		</Card>
	);
}

export function UseCaseGrid() {
	const [activeCategory, setActiveCategory] = useState<string>("All");

	const filteredFeatured =
		activeCategory === "All"
			? featured
			: featured.filter((uc) => uc.category === activeCategory);

	const filteredSecondary =
		activeCategory === "All"
			? secondary
			: secondary.filter((uc) => uc.category === activeCategory);

	return (
		<section id="use-cases" className="section-alt py-20">
			<div className="container-page">
				<p className="mono-label mb-3">Use Cases</p>
				<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Explore the demos
				</h2>
				<p className="mt-3 text-muted-foreground max-w-2xl">
					Interactive walkthroughs of EUDI Wallet use cases. Each demo guides
					you through a real credential flow end-to-end.
				</p>

				{/* Filter chips */}
				<div className="mt-8 flex flex-wrap gap-2">
					{categories.map((cat) => (
						<Badge
							key={cat}
							variant={activeCategory === cat ? "default" : "outline"}
							className={
								activeCategory === cat
									? "btn-eu-blue border-transparent cursor-pointer"
									: "cursor-pointer hover:bg-accent"
							}
							onClick={() => setActiveCategory(cat)}
						>
							{cat}
						</Badge>
					))}
				</div>

				{/* Featured cards — illustration-driven */}
				{filteredFeatured.length > 0 && (
					<div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{filteredFeatured.map((uc) => (
							<FeaturedCard key={uc.title} uc={uc} />
						))}
					</div>
				)}

				{/* Secondary — compact list */}
				{filteredSecondary.length > 0 && (
					<div className="mt-6 grid gap-4 sm:grid-cols-2">
						{filteredSecondary.map((uc) => (
							<SecondaryCard key={uc.title} uc={uc} />
						))}
					</div>
				)}

				{/* Empty state */}
				{filteredFeatured.length === 0 && filteredSecondary.length === 0 && (
					<div className="mt-10 text-center py-12 text-muted-foreground">
						<p>No use cases in this category yet.</p>
					</div>
				)}
			</div>
		</section>
	);
}
