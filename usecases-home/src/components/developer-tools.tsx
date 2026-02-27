import { ArrowRight, Bug, Code, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DeveloperTools() {
	return (
		<section className="section-alt py-20">
			<div className="container-page max-w-4xl mx-auto">
				<Card className="relative overflow-hidden border-border/60">
					<div className="absolute inset-0 bg-gradient-to-br from-eu-blue/5 to-transparent pointer-events-none" />
					<div className="relative p-8 sm:p-10">
						<p className="mono-label mb-3">For Developers</p>
						<h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
							Vidos Authorizer Tester
						</h2>
						<p className="mt-3 text-muted-foreground max-w-2xl">
							A developer-oriented tool for testing credential authorization
							flows outside of the use case demos. Build custom credential
							requests and inspect every detail of the exchange.
						</p>

						<div className="mt-6 grid gap-4 sm:grid-cols-3">
							<div className="flex items-start gap-3">
								<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-eu-blue-light text-eu-blue">
									<Code className="size-4" />
								</div>
								<div>
									<p className="text-sm font-medium">Custom Requests</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										Craft and send arbitrary credential requests
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-eu-blue-light text-eu-blue">
									<Terminal className="size-4" />
								</div>
								<div>
									<p className="text-sm font-medium">Full Inspection</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										See requests sent, responses received, and raw payloads
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-eu-blue-light text-eu-blue">
									<Bug className="size-4" />
								</div>
								<div>
									<p className="text-sm font-medium">Debug Logs</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										Detailed logs of the entire authorization lifecycle
									</p>
								</div>
							</div>
						</div>

						<div className="mt-8">
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
				</Card>
			</div>
		</section>
	);
}
