import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";
import { Footer } from "../components/footer";
import { Header } from "../components/header";

export function GuideLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				<div className="container-page max-w-4xl mx-auto py-4">
					<nav className="mb-8">
						<Link
							to="/"
							className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-eu-blue transition-colors"
						>
							<ArrowLeft className="size-4" />
							<Home className="size-3.5" />
							Back to Home
						</Link>
					</nav>
					{children}
				</div>
			</main>
			<Footer />
		</div>
	);
}
