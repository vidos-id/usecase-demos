import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
			<div className="max-w-2xl mx-auto text-center space-y-8">
				{/* Tagline */}
				<div className="space-y-4">
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
						Banking with your
						<span className="block text-primary">Digital Identity</span>
					</h1>

					{/* 2.2 EUDI Wallet Explainer */}
					<p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
						Experience secure banking powered by your EU Digital Identity
						Wallet. Sign up instantly using your verified PID credential.
					</p>
				</div>

				{/* CTAs */}
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					{/* 2.3 Create Account CTA */}
					<Button asChild size="lg" className="text-base px-8">
						<Link to="/signup">Create Account</Link>
					</Button>

					{/* 2.4 Sign In CTA */}
					<Button
						asChild
						variant="outline"
						size="lg"
						className="text-base px-8"
					>
						<Link to="/signin">Sign In</Link>
					</Button>
				</div>

				{/* Trust indicators */}
				<div className="pt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
					<div className="flex items-center gap-2">
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12l2 2 4-4m5.618-4.016A11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							/>
						</svg>
						<span>EUDI Wallet</span>
					</div>
					<div className="flex items-center gap-2">
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
						<span>Privacy-first</span>
					</div>
					<div className="flex items-center gap-2">
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						<span>Instant</span>
					</div>
				</div>
			</div>
		</div>
	);
}
