import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
	FeaturesSection,
	PoweredByVidos,
	TrustBadges,
	WalletCardVisual,
} from "@/components/landing";
import { Button } from "@/components/ui/button";
import { getSessionId, subscribeSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const [isAuthenticated, setIsAuthenticated] = useState(!!getSessionId());

	useEffect(() => {
		return subscribeSession(() => {
			setIsAuthenticated(!!getSessionId());
		});
	}, []);

	return (
		<div className="flex flex-col min-h-[calc(100vh-4rem)]">
			{/* Hero Section */}
			<section className="flex-1 flex items-center py-16 lg:py-24">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
						{/* Left: Copy */}
						<div className="space-y-8 animate-slide-up">
							{/* Badge */}
							<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
								<div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
								<span className="text-xs font-medium text-primary">
									PID Credential Verification Demo
								</span>
							</div>

							{/* Headline */}
							<div className="space-y-4">
								<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
									Banking without{" "}
									<span className="relative">
										<span className="relative z-10 text-primary">forms</span>
										<span className="absolute bottom-2 left-0 right-0 h-3 bg-primary/20 -rotate-1" />
									</span>
								</h1>
								<p className="text-lg text-muted-foreground max-w-md leading-relaxed">
									Your government-verified identity lives in your wallet. Use it
									to open accounts, send money, and apply for loans — no typing
									required.
								</p>
							</div>

							{/* CTAs */}
							<div className="flex flex-col sm:flex-row gap-3">
								{isAuthenticated ? (
									<Button
										asChild
										size="lg"
										className="text-base px-6 h-12 group"
									>
										<Link to="/dashboard">
											Continue to Dashboard
											<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
										</Link>
									</Button>
								) : (
									<>
										<Button
											asChild
											size="lg"
											className="text-base px-6 h-12 group"
										>
											<Link to="/signup">
												Create Account
												<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
											</Link>
										</Button>
										<Button
											asChild
											variant="outline"
											size="lg"
											className="text-base px-6 h-12"
										>
											<Link to="/signin">Sign In</Link>
										</Button>
									</>
								)}
							</div>

							<TrustBadges />
						</div>

						{/* Right: Visual */}
						<WalletCardVisual />
					</div>
				</div>
			</section>

			<PoweredByVidos />
			<FeaturesSection />
		</div>
	);
}
