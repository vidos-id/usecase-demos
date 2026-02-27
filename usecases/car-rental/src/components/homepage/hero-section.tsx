import { Shield, Sparkles } from "lucide-react";

export function HeroSection() {
	return (
		<section className="relative overflow-hidden pb-32 pt-20 sm:pt-28">
			{/* Background gradient */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.42 0.1 220 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, oklch(0.78 0.16 75 / 0.06) 0%, transparent 60%)",
				}}
			/>

			{/* Decorative circles */}
			<div
				className="animate-float pointer-events-none absolute right-12 top-16 hidden size-64 rounded-full opacity-5 md:block"
				style={{ background: "var(--primary)" }}
			/>
			<div
				className="animate-float pointer-events-none absolute -bottom-8 left-8 hidden size-48 rounded-full opacity-5 md:block"
				style={{ background: "var(--amber)", animationDelay: "2s" }}
			/>

			<div className="relative mx-auto max-w-7xl px-4 sm:px-6">
				<div className="mx-auto max-w-3xl text-center">
					{/* Badge */}
					<div className="animate-slide-down mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 shadow-sm">
						<Sparkles className="size-3.5" style={{ color: "var(--amber)" }} />
						<span className="text-xs font-medium text-muted-foreground">
							Powered by Vidos Authorizer
						</span>
					</div>

					{/* Heading */}
					<h1 className="animate-slide-up font-heading mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
						<span>Rent. </span>
						<span
							className="text-gradient"
							style={{
								backgroundImage:
									"linear-gradient(135deg, var(--primary) 0%, oklch(0.55 0.14 200) 100%)",
							}}
						>
							Verify.
						</span>
						<span> Drive.</span>
					</h1>

					{/* Subheading */}
					<p className="animate-slide-up delay-1 mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
						Skip the counter. Verify your identity with your digital wallet and
						pick up your car in seconds.
					</p>

					{/* Trust line */}
					<div className="animate-fade-in delay-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<Shield className="size-4" style={{ color: "var(--primary)" }} />
						<span>
							Powered by{" "}
							<span
								className="font-semibold"
								style={{ color: "var(--primary)" }}
							>
								Vidos Authorizer
							</span>{" "}
							— secure digital identity verification
						</span>
					</div>
				</div>
			</div>
		</section>
	);
}
