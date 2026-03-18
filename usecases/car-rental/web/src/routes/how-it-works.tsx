import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Wallet } from "lucide-react";
import { Footer } from "@/components/homepage/footer";
import { Header } from "@/components/homepage/header";
import { ApiSection } from "@/components/how-it-works/api-section";
import { HomeGuidesCta } from "@/components/how-it-works/home-guides-cta";
import { JourneySection } from "@/components/how-it-works/journey-section";
import { PillarsSection } from "@/components/how-it-works/pillars-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/how-it-works")({
	component: HowItWorksPage,
});

const blueAccent = "var(--primary)";

function HowItWorksPage() {
	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main>
				{/* ── 1. Hero ───────────────────────────────────────────────────── */}
				<section className="relative overflow-hidden border-b border-border/50 pb-20 pt-16">
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${blueAccent}09 0%, transparent 65%)`,
						}}
					/>

					<div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
						<Badge
							variant="secondary"
							className="mb-5 font-mono text-[11px] uppercase tracking-widest"
						>
							<Wallet className="mr-1.5 size-3" />
							EU Digital Identity · Car Rental
						</Badge>

						<h1 className="font-heading mb-5 text-5xl font-extrabold tracking-tight sm:text-6xl">
							Rent a car.
							<br />
							<span
								className="text-gradient"
								style={{
									backgroundImage: `linear-gradient(135deg, ${blueAccent}, oklch(0.55 0.18 200))`,
								}}
							>
								No paperwork.
							</span>
						</h1>

						<p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
							Customers prove identity in seconds using their EU Digital Wallet.
							Every verification is cryptographically signed, instantly
							auditable, and fully EU-compliant.
						</p>
					</div>
				</section>

				{/* ── 2. Before you start — link to home guides ─────────────────── */}
				<HomeGuidesCta />

				{/* ── 3. The car-rental experience ──────────────────────────────── */}
				<JourneySection />

				{/* ── 4. Why it matters ─────────────────────────────────────────── */}
				<PillarsSection />

				{/* ── 5. Vidos Authorizer API (car-rental specific) ─────────────── */}
				<ApiSection />

				{/* ── 6. CTA ────────────────────────────────────────────────────── */}
				<section className="py-20">
					<div className="mx-auto max-w-xl px-4 text-center sm:px-6">
						<Separator className="mb-16 opacity-40" />

						<p
							className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest"
							style={{ color: blueAccent }}
						>
							Ready to see it?
						</p>
						<h2 className="font-heading mb-4 text-3xl font-extrabold tracking-tight">
							Try the demo.
						</h2>
						<p className="mb-8 text-base text-muted-foreground">
							Book a car and verify your identity with the EU Digital Wallet —
							end to end, in under two minutes.
						</p>

						<Button
							asChild
							size="lg"
							className="rounded-xl px-8 text-base font-semibold"
						>
							<Link to="/">
								Start the demo
								<ArrowRight className="ml-2 size-4" />
							</Link>
						</Button>
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}
