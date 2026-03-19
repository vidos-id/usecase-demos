import { Link } from "@tanstack/react-router";
import {
	BookOpen,
	Bot,
	ChevronRight,
	CreditCard,
	ExternalLink,
	Globe,
	Shield,
	Sparkles,
	UserCheck,
} from "lucide-react";
import { useState } from "react";
import ageIllustration from "../assets/age-verification-illustration.svg";
import bankIllustration from "../assets/bank-illustration.svg";
import mdlIllustration from "../assets/mdl-illustration.svg";

/* ------------------------------------------------------------------ */
/*  Data model                                                         */
/* ------------------------------------------------------------------ */

interface AIGuide {
	/** Internal route base for the guide page */
	route: string;
}

interface ShowcaseDemo {
	title: string;
	tagline: string;
	description: string;
	category: string;
	illustration: string;
	status: "live" | "coming-soon";
	appUrl: string;
	aiGuide?: AIGuide;
	credentials: string[];
}

interface CompactDemo {
	title: string;
	description: string;
	category: string;
	icon: React.ReactNode;
	status: "coming-soon";
}

const categories = [
	"All",
	"Core Functionality",
	"Banking & Payment",
	"Travel",
	"Consumer",
] as const;

/* ------------------------------------------------------------------ */
/*  Environment URLs                                                   */
/* ------------------------------------------------------------------ */

const carRentalUrl =
	import.meta.env.VITE_CAR_RENTAL_URL ?? "http://localhost:29750/car-rental/";
const demoBankUrl =
	import.meta.env.VITE_DEMO_BANK_URL ?? "http://localhost:55930/bank/";
const wineShopUrl =
	import.meta.env.VITE_WINE_SHOP_URL ?? "http://localhost:29751/wine-shop/";

/* ------------------------------------------------------------------ */
/*  Showcase demos                                                     */
/* ------------------------------------------------------------------ */

const showcaseDemos: ShowcaseDemo[] = [
	{
		title: "Wine Shop with Age Verification",
		tagline: "Age-verified online purchases",
		description:
			"Order wine online and verify your age using your EUDI Wallet. The shop checks your PID credential against the shipping destination's legal drinking age.",
		category: "Consumer",
		illustration: ageIllustration,
		status: "live",
		appUrl: wineShopUrl,
		credentials: ["PID", "Age Attestation"],
		aiGuide: { route: "/mcp-wine-agent" },
	},
	{
		title: "Car Rental with Mobile Driving Licence",
		tagline: "Digital licence verification for rentals",
		description:
			"Rent a car by presenting your mobile driving licence from your EUDI Wallet. The rental agency verifies your licence category and validity in seconds.",
		category: "Travel",
		illustration: mdlIllustration,
		status: "live",
		appUrl: carRentalUrl,
		credentials: ["PID", "mDL"],
		aiGuide: { route: "/mcp-car-rental-agent" },
	},
	{
		title: "Banking Sign-up with Personal ID",
		tagline: "Digital onboarding for banking",
		description:
			"Open a bank account using your EUDI Wallet. Present your PID credential to verify your identity instantly — no paperwork, no branch visit.",
		category: "Banking & Payment",
		illustration: bankIllustration,
		status: "live",
		appUrl: demoBankUrl,
		credentials: ["PID"],
	},
];

/* ------------------------------------------------------------------ */
/*  Compact / coming-soon demos                                        */
/* ------------------------------------------------------------------ */

const compactDemos: CompactDemo[] = [
	{
		title: "PID-based Identification in Online Services",
		description:
			"Secure identification in an online service using the PID stored in an EUDI Wallet.",
		category: "Core Functionality",
		icon: <Shield className="size-4" />,
		status: "coming-soon",
	},
	{
		title: "Use of a Pseudonym in Online Services",
		description:
			"Interact with digital platforms without revealing your full identity.",
		category: "Core Functionality",
		icon: <UserCheck className="size-4" />,
		status: "coming-soon",
	},
	{
		title: "eSignature",
		description:
			"Create qualified electronic signatures with the same legal validity as a handwritten signature.",
		category: "Core Functionality",
		icon: <BookOpen className="size-4" />,
		status: "coming-soon",
	},
	{
		title: "Payment Authentication",
		description:
			"Enables online payments to be authorised via an EUDI Wallet with strong customer authentication.",
		category: "Banking & Payment",
		icon: <CreditCard className="size-4" />,
		status: "coming-soon",
	},
];

/* ------------------------------------------------------------------ */
/*  Showcase card                                                      */
/* ------------------------------------------------------------------ */

function ShowcaseCard({ demo }: { demo: ShowcaseDemo }) {
	return (
		<div className="group relative grid grid-cols-1 sm:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr] overflow-hidden rounded-xl border bg-card transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5">
			{/* Illustration panel */}
			<div className="relative flex items-center justify-center bg-surface p-6 min-h-[180px] sm:min-h-0 border-b sm:border-b-0 sm:border-r border-border">
				<div className="relative z-10 transition-transform duration-400 ease-out group-hover:scale-[1.04]">
					<img
						src={demo.illustration}
						alt=""
						className="h-28 lg:h-32 w-auto object-contain"
					/>
				</div>
				{/* Credential pills */}
				<div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-1.5">
					{demo.credentials.map((cred) => (
						<span
							key={cred}
							className="mono-label rounded-md bg-eu-blue/8 text-eu-blue px-2 py-0.5 text-[10px] backdrop-blur-sm"
						>
							{cred}
						</span>
					))}
				</div>
			</div>

			{/* Content panel */}
			<div className="flex flex-col p-5 sm:py-4 sm:px-5">
				<div className="flex-1">
					<div className="flex items-center gap-2.5 mb-3">
						<span className="inline-flex items-center rounded-full bg-eu-blue-light text-eu-blue px-2.5 py-0.5 text-xs font-medium">
							{demo.category}
						</span>
						<StatusDot status={demo.status} />
					</div>
					<h3 className="text-base sm:text-lg font-semibold leading-snug tracking-tight">
						{demo.title}
					</h3>
					<p className="text-sm text-muted-foreground mt-0.5 font-medium italic">
						{demo.tagline}
					</p>
					<p className="text-sm text-muted-foreground mt-2 leading-relaxed">
						{demo.description}
					</p>
				</div>

				{/* Actions */}
				<div className="mt-4 flex flex-col md:flex-row md:items-stretch gap-2.5 md:gap-3">
					{/* Web app button */}
					<a
						href={demo.appUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-3 rounded-lg bg-eu-blue text-eu-blue-foreground px-3.5 py-2.5 shrink-0 no-underline transition-all duration-200 ease-out hover:bg-eu-blue-dark hover:translate-x-0.5"
					>
						<span className="flex items-center justify-center size-7 rounded-md bg-white/15 shrink-0">
							<Globe className="size-4" />
						</span>
						<span className="flex flex-col flex-1 min-w-0">
							<span className="text-sm font-semibold leading-tight">
								Open web app
							</span>
							<span className="text-[11px] mt-0.5 opacity-65">
								Interactive demo
							</span>
						</span>
						<ExternalLink className="size-3.5 shrink-0 opacity-60 transition-all duration-200 group-hover:opacity-100" />
					</a>

					{/* AI guide buttons */}
					{demo.aiGuide && <AIGuideButtonGroup route={demo.aiGuide.route} />}
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  AI guide button group — ChatGPT + OpenClaw side by side            */
/* ------------------------------------------------------------------ */

function AIGuideButtonGroup({ route }: { route: string }) {
	return (
		<div className="flex flex-col gap-1.5 md:flex-1">
			<span className="mono-label flex items-center gap-1.5 text-eu-blue opacity-65">
				<Sparkles className="size-3" />
				AI agent guide
			</span>
			<div className="flex gap-2">
				<Link
					to={route}
					search={{ agent: "chatgpt" }}
					className="flex flex-1 items-center gap-2 rounded-lg border border-eu-blue/15 bg-eu-blue-light/50 px-3 py-2 text-sm font-medium text-foreground no-underline transition-all duration-200 ease-out hover:border-eu-blue hover:bg-eu-blue-light hover:translate-x-px"
				>
					<Bot className="size-3.5 shrink-0" />
					<span>ChatGPT</span>
					<ChevronRight className="size-3 ml-auto opacity-50" />
				</Link>
				<Link
					to={route}
					search={{ agent: "openclaw" }}
					className="flex flex-1 items-center gap-2 rounded-lg border border-amber-600/15 bg-amber-50/50 px-3 py-2 text-sm font-medium text-foreground no-underline transition-all duration-200 ease-out hover:border-amber-600/40 hover:bg-amber-50 hover:translate-x-px"
				>
					<span className="text-sm leading-none shrink-0">🦞</span>
					<span>OpenClaw</span>
					<ChevronRight className="size-3 ml-auto opacity-50" />
				</Link>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Compact card (coming soon)                                         */
/* ------------------------------------------------------------------ */

function CompactCard({ demo }: { demo: CompactDemo }) {
	return (
		<div className="flex items-start gap-3 rounded-lg border bg-card p-4 opacity-65 transition-all duration-200 hover:opacity-85">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
				{demo.icon}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<h3 className="text-sm font-medium leading-snug">{demo.title}</h3>
				</div>
				<p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
					{demo.description}
				</p>
			</div>
			<div className="shrink-0 pt-0.5">
				<StatusDot status={demo.status} />
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Status dot                                                         */
/* ------------------------------------------------------------------ */

function StatusDot({ status }: { status: "live" | "coming-soon" }) {
	return (
		<div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
			<span
				className={`status-dot ${
					status === "live" ? "status-dot--active" : "status-dot--pending"
				}`}
			/>
			{status === "live" ? "Live" : "Soon"}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Grid                                                               */
/* ------------------------------------------------------------------ */

export function UseCaseGrid() {
	const [activeCategory, setActiveCategory] = useState<string>("All");

	const filteredShowcase =
		activeCategory === "All"
			? showcaseDemos
			: showcaseDemos.filter((d) => d.category === activeCategory);

	const filteredCompact =
		activeCategory === "All"
			? compactDemos
			: compactDemos.filter((d) => d.category === activeCategory);

	return (
		<section id="use-cases" className="section-alt py-10 lg:py-14">
			<div className="container-page">
				{/* Section header */}
				<p className="mono-label mb-3">Use Cases</p>
				<h2 className="heading-mixed">
					<strong>Explore</strong> the demos
				</h2>
				<p className="mt-4 text-muted-foreground max-w-2xl text-lg leading-relaxed">
					Each demo features an interactive web app you can try end-to-end. Some
					demos also include AI agent guides for ChatGPT and OpenClaw.
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

				{/* Showcase demos — each full-width */}
				{filteredShowcase.length > 0 && (
					<div className="mt-10 flex flex-col gap-5">
						{filteredShowcase.map((demo) => (
							<ShowcaseCard key={demo.title} demo={demo} />
						))}
					</div>
				)}

				{/* Compact / coming-soon */}
				{filteredCompact.length > 0 && (
					<div className="mt-8">
						<p className="mono-label mb-4">Coming soon</p>
						<div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
							{filteredCompact.map((demo) => (
								<CompactCard key={demo.title} demo={demo} />
							))}
						</div>
					</div>
				)}

				{/* Empty state */}
				{filteredShowcase.length === 0 && filteredCompact.length === 0 && (
					<div className="mt-10 text-center py-16 text-muted-foreground">
						<p>No use cases in this category yet.</p>
					</div>
				)}
			</div>
		</section>
	);
}
