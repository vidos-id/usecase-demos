import { DeveloperTools } from "./components/developer-tools";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { Hero } from "./components/hero";
import { HowItWorks } from "./components/how-it-works";
import { UseCaseGrid } from "./components/use-case-grid";

export function App() {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				<Hero />
				<UseCaseGrid />
				<DeveloperTools />
				<HowItWorks />
			</main>
			<Footer />
		</div>
	);
}
