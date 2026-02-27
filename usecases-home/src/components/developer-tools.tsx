import { ArrowRight, Bug, Code, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeveloperTools() {
	return (
		<section className="section-alt py-20 lg:py-24">
			<div className="container-page max-w-4xl mx-auto">
				<div className="relative overflow-hidden rounded-2xl border bg-card">
					{/* Subtle EU-blue gradient bar at top */}
					<div className="h-1.5 bg-gradient-to-r from-eu-blue via-eu-blue/70 to-eu-blue/30" />

					<div className="p-8 sm:p-10">
						<p className="mono-label mb-3">For Developers</p>
						<h2 className="heading-mixed">
							Vidos <strong>Authorizer Tester</strong>
						</h2>
						<p className="mt-4 text-muted-foreground max-w-2xl text-lg leading-relaxed">
							A developer-oriented tool for testing credential authorization
							flows outside of the use case demos. Build custom credential
							requests and inspect every detail of the exchange.
						</p>

						<div className="mt-8 grid gap-5 sm:grid-cols-3">
							<FeatureItem
								icon={<Code className="size-4" />}
								title="Custom Requests"
								description="Craft and send arbitrary credential requests"
							/>
							<FeatureItem
								icon={<Terminal className="size-4" />}
								title="Full Inspection"
								description="See requests, responses, and raw payloads"
							/>
							<FeatureItem
								icon={<Bug className="size-4" />}
								title="Debug Logs"
								description="Detailed logs of the authorization lifecycle"
							/>
						</div>

						<div className="mt-10">
							<Button className="btn-eu-blue" size="lg" asChild>
								<a
									href="https://authorizer.demo.vidos.id/"
									target="_blank"
									rel="noopener noreferrer"
								>
									Open Authorizer Tester
									<ArrowRight className="size-4" />
								</a>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function FeatureItem({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-eu-blue-light text-eu-blue">
				{icon}
			</div>
			<div>
				<p className="text-sm font-semibold">{title}</p>
				<p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
					{description}
				</p>
			</div>
		</div>
	);
}
