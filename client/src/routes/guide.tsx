import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Shield, Wallet } from "lucide-react";
import { useState } from "react";
import { EudiGuide } from "@/components/guide/eudi-guide";
import { MultipazGuide } from "@/components/guide/multipaz-guide";
import { ProtocolCard, SectionHeader } from "@/components/guide/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/guide")({
	component: GuidePage,
});

type WalletTab = "eudi" | "multipaz";

function GuidePage() {
	const [activeTab, setActiveTab] = useState<WalletTab>("eudi");

	return (
		<div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto space-y-12">
				{/* Header */}
				<header className="space-y-6 animate-slide-up">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
						<FileText className="h-3.5 w-3.5 text-primary" />
						<span className="text-xs font-medium text-primary">
							Getting Started Guide
						</span>
					</div>

					<div className="space-y-4">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
							How to use{" "}
							<span className="relative">
								<span className="relative z-10 text-primary">
									VidosDemoBank
								</span>
								<span className="absolute bottom-1 left-0 right-0 h-2.5 bg-primary/20 -rotate-1" />
							</span>
						</h1>
						<p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
							Set up an EUDI-compatible wallet and experience PID-based
							identification — the same flow banks will use for KYC and Strong
							Customer Authentication under eIDAS 2.0.
						</p>
					</div>

					{/* Wallet Tabs */}
					<div className="flex gap-2 p-1 rounded-xl bg-muted/50 border border-border/60 w-fit">
						<WalletTab
							active={activeTab === "eudi"}
							onClick={() => setActiveTab("eudi")}
							icon={<Shield className="h-4 w-4" />}
							name="EUDI Wallet"
							status="direct_post"
						/>
						<WalletTab
							active={activeTab === "multipaz"}
							onClick={() => setActiveTab("multipaz")}
							icon={<Wallet className="h-4 w-4" />}
							name="Multipaz"
							status="direct_post + DC API"
						/>
					</div>
				</header>

				{/* Quick Start */}
				<section className="space-y-6">
					<SectionHeader
						icon={<ArrowRight className="h-5 w-5" />}
						title="Quick Start"
						description="Already have a wallet with PID credentials? Jump right in."
					/>

					<div className="grid sm:grid-cols-2 gap-4">
						<QuickStartCard
							to="/signup"
							title="Create Account"
							description="Use your wallet to create a VidosDemoBank account in seconds"
							primary
						/>
						<QuickStartCard
							to="/signin"
							title="Sign In"
							description="Already registered? Sign in with your wallet"
						/>
					</div>
				</section>

				{/* Active Wallet Guide */}
				<section className="animate-fade-in">
					{activeTab === "eudi" ? <EudiGuide /> : <MultipazGuide />}
				</section>

				{/* Protocol Reference */}
				<section className="space-y-6">
					<SectionHeader
						icon={<FileText className="h-5 w-5" />}
						title="Protocol & Regulatory Reference"
						description="Standards and regulations behind EUDI Wallet verification."
					/>

					<div className="grid sm:grid-cols-2 gap-4">
						<ProtocolCard
							title="OID4VP"
							description="OpenID for Verifiable Presentations - credential presentation standard"
							href="https://openid.net/specs/openid-4-verifiable-presentations-1_0.html"
						/>
						<ProtocolCard
							title="DC API"
							description="Digital Credentials API - browser-native credential exchange"
							href="https://wicg.github.io/digital-credentials/"
						/>
						<ProtocolCard
							title="PID Rulebook"
							description="Official EU specification for Person Identification Data attributes and encoding"
							href="https://eudi.dev/latest/annexes/annex-3/annex-3.01-pid-rulebook/"
						/>
						<ProtocolCard
							title="ARF Documentation"
							description="Architecture and Reference Framework for EUDI Wallet ecosystem"
							href="https://eudi.dev/latest/"
						/>
					</div>

					{/* Regulatory context */}
					<div className="rounded-xl bg-muted/30 border border-border/40 p-5 space-y-3">
						<h3 className="font-semibold text-sm">
							eIDAS 2.0 Compliance Timeline
						</h3>
						<div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
							<div className="space-y-1">
								<p className="font-medium text-foreground">
									Dec 2026 - Public Sector
								</p>
								<p>Government services must accept EUDI Wallet credentials</p>
							</div>
							<div className="space-y-1">
								<p className="font-medium text-foreground">
									Dec 2027 - Private Sector
								</p>
								<p>
									Banks and major platforms must accept wallet credentials for
									SCA
								</p>
							</div>
						</div>
						<p className="text-xs text-muted-foreground/70">
							Non-compliance: up to 5M EUR or 1% annual turnover (Article 16,
							Regulation EU 2024/1183)
						</p>
					</div>
				</section>

				{/* Footer CTA */}
				<footer className="pt-8 border-t border-border/40">
					<div className="text-center space-y-4">
						<p className="text-muted-foreground">
							Ready to experience the future of digital identity?
						</p>
						<Button asChild size="lg" className="h-12 px-8 text-base group">
							<Link to="/signup">
								Get Started
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>
						</Button>
					</div>
				</footer>
			</div>
		</div>
	);
}

// ============================================================================
// Components
// ============================================================================

function WalletTab({
	active,
	onClick,
	icon,
	name,
	status,
}: {
	active: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	name: string;
	status: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200",
				active
					? "bg-background border border-border/60 shadow-sm"
					: "hover:bg-background/50",
			)}
		>
			<span className={cn(active ? "text-primary" : "text-muted-foreground")}>
				{icon}
			</span>
			<span
				className={cn(
					"font-medium text-sm",
					active ? "text-foreground" : "text-muted-foreground",
				)}
			>
				{name}
			</span>
			<span
				className={cn(
					"text-[10px] font-mono px-1.5 py-0.5 rounded",
					active
						? "bg-primary/10 text-primary"
						: "bg-muted text-muted-foreground",
				)}
			>
				{status}
			</span>
		</button>
	);
}

function QuickStartCard({
	to,
	title,
	description,
	primary = false,
}: {
	to: string;
	title: string;
	description: string;
	primary?: boolean;
}) {
	return (
		<Link
			to={to}
			className={cn(
				"group p-6 rounded-2xl border transition-all duration-300 block",
				primary
					? "bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
					: "bg-background border-border/60 hover:border-primary/40",
			)}
		>
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg mb-1">{title}</h3>
					<p
						className={cn(
							"text-sm",
							primary ? "opacity-90" : "text-muted-foreground",
						)}
					>
						{description}
					</p>
				</div>
				<ArrowRight
					className={cn(
						"h-5 w-5 transition-transform group-hover:translate-x-1",
						primary ? "opacity-80" : "text-muted-foreground",
					)}
				/>
			</div>
		</Link>
	);
}
