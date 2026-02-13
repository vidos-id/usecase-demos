import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Fingerprint,
	Lock,
	Shield,
	Smartphone,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
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
									EU Digital Identity Wallet Demo
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

							{/* Trust bar */}
							<div className="flex items-center gap-6 pt-4 text-muted-foreground/70">
								<div className="flex items-center gap-1.5">
									<Shield className="h-4 w-4" />
									<span className="text-sm">PID Verified</span>
								</div>
								<div className="flex items-center gap-1.5">
									<Lock className="h-4 w-4" />
									<span className="text-sm">Privacy-first</span>
								</div>
								<div className="flex items-center gap-1.5">
									<Zap className="h-4 w-4" />
									<span className="text-sm">Instant</span>
								</div>
							</div>
						</div>

						{/* Right: Visual */}
						<div className="relative lg:h-[480px] flex items-center justify-center animate-slide-in-right">
							{/* Background decoration */}
							<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-3xl" />
							<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

							{/* Card stack visualization */}
							<div className="relative z-10 w-full max-w-sm">
								{/* Back card - Traditional form */}
								<div className="absolute top-8 left-4 right-4 bg-muted/50 rounded-2xl p-6 border border-border/40 rotate-[-3deg] opacity-60">
									<div className="space-y-3">
										<div className="h-3 w-24 bg-muted-foreground/20 rounded" />
										<div className="h-8 w-full bg-muted-foreground/10 rounded" />
										<div className="h-3 w-20 bg-muted-foreground/20 rounded" />
										<div className="h-8 w-full bg-muted-foreground/10 rounded" />
										<div className="h-3 w-28 bg-muted-foreground/20 rounded" />
										<div className="h-8 w-full bg-muted-foreground/10 rounded" />
									</div>
								</div>

								{/* Front card - Wallet */}
								<div className="relative bg-gradient-to-br from-background to-muted/30 rounded-2xl p-6 border border-border shadow-2xl shadow-primary/10 rotate-[2deg]">
									{/* Wallet header */}
									<div className="flex items-center justify-between mb-6">
										<div className="flex items-center gap-2">
											<div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
												<Smartphone className="h-4 w-4 text-primary" />
											</div>
											<div>
												<div className="text-sm font-semibold">EUDI Wallet</div>
												<div className="text-[10px] text-muted-foreground">
													Person Identification
												</div>
											</div>
										</div>
										<div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
											<div className="h-2 w-2 rounded-full bg-green-500" />
										</div>
									</div>

									{/* Credential preview */}
									<div className="space-y-3 mb-6">
										<div className="flex justify-between items-center py-2 border-b border-border/40">
											<span className="text-xs text-muted-foreground">
												Full Name
											</span>
											<span className="text-sm font-medium">Maria García</span>
										</div>
										<div className="flex justify-between items-center py-2 border-b border-border/40">
											<span className="text-xs text-muted-foreground">
												Date of Birth
											</span>
											<span className="text-sm font-medium">1990-05-15</span>
										</div>
										<div className="flex justify-between items-center py-2 border-b border-border/40">
											<span className="text-xs text-muted-foreground">
												Nationality
											</span>
											<span className="text-sm font-medium">Spanish</span>
										</div>
									</div>

									{/* Action */}
									<div className="flex items-center justify-center gap-2 py-3 bg-primary/10 rounded-lg">
										<Fingerprint className="h-4 w-4 text-primary" />
										<span className="text-sm font-medium text-primary">
											Share with DemoBank
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16 border-t border-border/40 bg-muted/20">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid sm:grid-cols-3 gap-8">
						<FeatureCard
							icon={<Fingerprint className="h-5 w-5" />}
							title="What is PID?"
							description="Person Identification Data is your government-verified digital identity. Name, birthdate, nationality — cryptographically signed and stored in your wallet."
						/>
						<FeatureCard
							icon={<Smartphone className="h-5 w-5" />}
							title="Your Wallet, Your Data"
							description="Your credentials stay on your device. You choose what to share, when to share it, and with whom. No central database, no tracking."
						/>
						<FeatureCard
							icon={<Shield className="h-5 w-5" />}
							title="Why It Matters"
							description="No more password resets. No identity theft. No form fatigue. Just tap your wallet and go — verified in seconds."
						/>
					</div>
				</div>
			</section>
		</div>
	);
}

function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="group p-6 rounded-2xl bg-background border border-border/40 hover:border-primary/30 transition-colors duration-300">
			<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors duration-300">
				{icon}
			</div>
			<h3 className="text-base font-semibold mb-2">{title}</h3>
			<p className="text-sm text-muted-foreground leading-relaxed">
				{description}
			</p>
		</div>
	);
}
