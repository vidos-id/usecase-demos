import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/homepage/footer";
import { Header } from "@/components/homepage/header";
import { HeroSection } from "@/components/homepage/hero-section";
import { HowItWorks } from "@/components/homepage/how-it-works";
import { SearchBar } from "@/components/homepage/search-bar";
import { TrustSection } from "@/components/homepage/trust-section";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<div className="min-h-screen">
			<Header />
			<main>
				<HeroSection />
				<SearchBar />
				<div className="pt-16">
					<HowItWorks />
				</div>
				<TrustSection />
			</main>
			<Footer />
		</div>
	);
}
