import {
	Banknote,
	BookOpen,
	ChevronRight,
	CreditCard,
	ExternalLink,
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
	/** Full cross-app URL — only set for live demos */
	href?: string;
}

const carRentalUrl =
	import.meta.env.VITE_CAR_RENTAL_URL ?? "http://localhost:29750/car-rental/";
const demoBankUrl =
	import.meta.env.VITE_DEMO_BANK_URL ?? "http://localhost:55930/bank/";
const wineShopUrl =
	import.meta.env.VITE_WINE_SHOP_URL ?? "http://localhost:29751/wine-shop/";

const useCases: UseCase[] = [
	// --- Featured (with illustrations) ---
	{
		title: "Banking Sign-up with Personal ID",
		description:
			"Open a bank account using your EUDI Wallet. Present your PID credential to verify your identity instantly — no paperwork, no branch visit.",
		category: "Banking & Payment",
		illustration: bankIllustration,
		status: "live",
		href: demoBankUrl,
	},
	{
		title: "Car Rental with Mobile Driving Licence",
		description:
			"Rent a car by presenting your mobile driving licence from your EUDI Wallet. The rental agency verifies your licence category and validity in seconds.",
		category: "Travel",
		illustration: mdlIllustration,
		status: "live",
		href: carRentalUrl,
	},
	{
		title: "Wine Shop with Age Verification",
		description:
			"Order wine online and verify your age using your EUDI Wallet. The shop checks your PID credential against the shipping destination's legal drinking age.",
		category: "Consumer",
		illustration: ageIllustration,
		status: "live",
		href: wineShopUrl,
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
];

function FeaturedCard({ uc }: { uc: UseCase }) {
	const isLive = uc.status === "live" && uc.href;
	const cardContent = (
		<Card
			className={`overflow-hidden flex flex-col bg-card ${isLive ? "card-hover cursor-pointer" : ""}`}
		>
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
				{isLive ? (
					<Button
						variant="ghost"
						size="sm"
						className="text-eu-blue hover:text-eu-blue hover:bg-eu-blue-light -ml-2.5 font-medium pointer-events-none"
						tabIndex={-1}
					>
						Try the demo
						<ExternalLink className="size-3.5" />
					</Button>
				) : (
					<span className="text-xs text-muted-foreground italic">
						Coming soon
					</span>
				)}
			</CardFooter>
		</Card>
	);

	if (isLive) {
		return (
			<a href={uc.href} target="_blank" rel="noopener noreferrer">
				{cardContent}
			</a>
		);
	}
	return cardContent;
}

function SecondaryCard({ uc }: { uc: UseCase }) {
	const isLive = uc.status === "live" && uc.href;
	const cardContent = (
		<Card
			className={`flex items-start gap-4 p-5 ${isLive ? "card-hover cursor-pointer" : ""}`}
		>
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
				{isLive ? (
					<Button
						variant="ghost"
						size="sm"
						className="text-eu-blue hover:text-eu-blue hover:bg-eu-blue-light -ml-2.5 mt-2 font-medium pointer-events-none"
						tabIndex={-1}
					>
						Try the demo
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

	if (isLive) {
		return (
			<a href={uc.href} target="_blank" rel="noopener noreferrer">
				{cardContent}
			</a>
		);
	}
	return cardContent;
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
		<section id="use-cases" className="section-alt py-10 lg:py-12">
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
