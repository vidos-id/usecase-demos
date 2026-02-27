import {
	Banknote,
	BookOpen,
	ChevronRight,
	CreditCard,
	GraduationCap,
	Heart,
	Landmark,
	ParkingCircle,
	Pill,
	Plane,
	Scale,
	Shield,
	Ticket,
	Truck,
	UserCheck,
	Users,
	Volume2,
} from "lucide-react";
import { useState } from "react";
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
	"Health & Social Security",
	"Travel",
	"Consumer",
	"Education",
	"Identification",
	"Legal Representation",
] as const;

interface UseCase {
	title: string;
	description: string;
	category: string;
	illustration?: string;
	icon?: React.ReactNode;
	status: "live" | "coming-soon";
}

const useCases: UseCase[] = [
	// --- Featured (with illustrations) ---
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

	// --- Secondary (icon-based) ---
	{
		title: "PID-based Identification in Online Services",
		description:
			"Secure identification in an online service using the PID stored in an EUDI Wallet.",
		category: "Core Functionality",
		icon: <Shield className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Use of a Pseudonym in Online Services",
		description:
			"Interact with digital platforms without revealing your full identity, neither explicitly, implicitly nor functionally necessitated to.",
		category: "Core Functionality",
		icon: <UserCheck className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "eSignature",
		description:
			"Create qualified electronic signatures with the same legal validity as a handwritten signature.",
		category: "Core Functionality",
		icon: <BookOpen className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Payment Authentication",
		description:
			"Enables online payments to be authorised via an EUDI Wallet with strong customer authentication.",
		category: "Banking & Payment",
		icon: <CreditCard className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Identification in Proximity Scenarios",
		description:
			"Secure in-person identification for services where the credential holder means proving personal presence of identity.",
		category: "Identification",
		icon: <Users className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "e-Prescription",
		description:
			"Identify yourself in order to access e-prescriptions stored and presented via an EUDI Wallet.",
		category: "Health & Social Security",
		icon: <Pill className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "European Health Insurance Card (EHIC)",
		description:
			"Grants access to necessary healthcare when in another Member State, presented digitally via EUDI Wallet.",
		category: "Health & Social Security",
		icon: <Heart className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "European Disability Card",
		description:
			"Serves as proof of recognised disability status and entitlement to disability services across Member States.",
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
		title: "Educational Credentials",
		description:
			"Store, manage, and present digitally verifiable education-related credentials, like diplomas and certificates.",
		category: "Education",
		icon: <GraduationCap className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "European Student Card",
		description:
			"Enables students to store and present their student status digitally across European institutions.",
		category: "Education",
		icon: <GraduationCap className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Natural or Legal Person Representation",
		description:
			"Enables users to act on behalf of another individual or an organisation using digitally verifiable credentials.",
		category: "Legal Representation",
		icon: <Scale className="size-5" />,
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
	{
		title: "Ticket or Pass",
		description:
			"Store, manage, and present digital tickets, event passes, and access passes via boarding passes or event tickets.",
		category: "Consumer",
		icon: <Ticket className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Vehicle Registration Certificate (VRC)",
		description:
			"Proves the registration and legal compliance of a vehicle with national and European road transport regulations.",
		category: "Travel",
		icon: <Truck className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Public Warnings",
		description:
			"Enables trusted public authorities to issue national or subnational warnings and alerts, like for natural disasters.",
		category: "Consumer",
		icon: <Volume2 className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "Open Bank Account",
		description:
			"Enables individuals to open a bank account entirely online using their EUDI Wallet credentials.",
		category: "Banking & Payment",
		icon: <Landmark className="size-5" />,
		status: "coming-soon",
	},
	{
		title: "SCA for Payment",
		description:
			"Strong Customer Authentication for payment authorisation using credentials stored in an EUDI Wallet.",
		category: "Banking & Payment",
		icon: <Banknote className="size-5" />,
		status: "coming-soon",
	},
];

function FeaturedCard({ uc }: { uc: UseCase }) {
	return (
		<Card className="card-hover overflow-hidden flex flex-col bg-card">
			<div className="flex items-center justify-center p-8 bg-surface border-b">
				<img
					src={uc.illustration}
					alt=""
					className="h-36 w-auto object-contain"
				/>
			</div>
			<CardHeader className="pb-3 pt-5 px-5 flex-1">
				<div className="flex items-center justify-between gap-2 mb-2">
					<span className="inline-flex items-center rounded-full bg-eu-blue-light text-eu-blue px-2.5 py-0.5 text-xs font-medium">
						{uc.category}
					</span>
					<StatusIndicator status={uc.status} />
				</div>
				<CardTitle className="text-base font-semibold leading-snug">
					{uc.title}
				</CardTitle>
				<CardDescription className="text-sm mt-1.5 leading-relaxed">
					{uc.description}
				</CardDescription>
			</CardHeader>
			<CardFooter className="mt-auto pt-0 px-5 pb-5">
				{uc.status === "live" ? (
					<Button
						variant="ghost"
						size="sm"
						className="text-eu-blue hover:text-eu-blue hover:bg-eu-blue-light -ml-2.5 font-medium"
					>
						Discover the use case
						<ChevronRight className="size-4" />
					</Button>
				) : (
					<span className="text-xs text-muted-foreground italic">
						Coming soon
					</span>
				)}
			</CardFooter>
		</Card>
	);
}

function SecondaryCard({ uc }: { uc: UseCase }) {
	return (
		<Card className="card-hover flex items-start gap-4 p-5">
			<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-eu-blue-light text-eu-blue">
				{uc.icon}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between gap-2">
					<h3 className="text-sm font-semibold truncate">{uc.title}</h3>
					<StatusIndicator status={uc.status} />
				</div>
				<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
					{uc.description}
				</p>
				{uc.status === "live" ? (
					<Button
						variant="ghost"
						size="sm"
						className="text-eu-blue hover:text-eu-blue hover:bg-eu-blue-light -ml-2.5 mt-2 font-medium"
					>
						Discover the use case
						<ChevronRight className="size-4" />
					</Button>
				) : (
					<span className="inline-flex items-center gap-1.5 mt-2 text-xs text-muted-foreground italic">
						Coming soon
					</span>
				)}
			</div>
		</Card>
	);
}

function StatusIndicator({ status }: { status: "live" | "coming-soon" }) {
	return (
		<div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
			<span
				className={`status-dot ${
					status === "live" ? "status-dot--active" : "status-dot--pending"
				}`}
			/>
			{status === "live" ? "Live demo" : "Coming soon"}
		</div>
	);
}

export function UseCaseGrid() {
	const [activeCategory, setActiveCategory] = useState<string>("All");

	const filtered =
		activeCategory === "All"
			? useCases
			: useCases.filter((uc) => uc.category === activeCategory);

	const featured = filtered.filter((uc) => uc.illustration);
	const secondary = filtered.filter((uc) => !uc.illustration);

	return (
		<section id="use-cases" className="section-alt py-20 lg:py-24">
			<div className="container-page">
				{/* Section header */}
				<p className="mono-label mb-3">Use Cases</p>
				<h2 className="heading-mixed">
					<strong>Explore</strong> the use case demos
				</h2>
				<p className="mt-4 text-muted-foreground max-w-2xl text-lg leading-relaxed">
					Here you can find all the currently published use case demos. Each
					demo contains a description, user journey, and an interactive
					credential flow you can try end-to-end.
				</p>

				{/* Filter chips */}
				<div className="mt-8 flex flex-wrap gap-2" role="tablist">
					{categories.map((cat) => (
						<button
							key={cat}
							type="button"
							role="tab"
							aria-selected={activeCategory === cat}
							onClick={() => setActiveCategory(cat)}
							className={`chip ${activeCategory === cat ? "chip--active" : ""}`}
						>
							{cat}
						</button>
					))}
				</div>

				{/* Featured cards — illustration-driven */}
				{featured.length > 0 && (
					<div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{featured.map((uc) => (
							<FeaturedCard key={uc.title} uc={uc} />
						))}
					</div>
				)}

				{/* Secondary — compact list */}
				{secondary.length > 0 && (
					<div
						className={`${featured.length > 0 ? "mt-6" : "mt-10"} grid gap-4 sm:grid-cols-2`}
					>
						{secondary.map((uc) => (
							<SecondaryCard key={uc.title} uc={uc} />
						))}
					</div>
				)}

				{/* Empty state */}
				{filtered.length === 0 && (
					<div className="mt-10 text-center py-16 text-muted-foreground">
						<p>No use cases in this category yet.</p>
					</div>
				)}
			</div>
		</section>
	);
}
