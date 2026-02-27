import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
	return (
		<section className="py-20 lg:py-28">
			<div className="container-page max-w-3xl text-center mx-auto">
				<p className="mono-label mb-4">EUDI Wallet Use Case Demos</p>
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
					Experience the{" "}
					<span className="text-eu-blue">EU Digital Identity Wallet</span>
				</h1>
				<p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
					Interactive demonstrations of real-world EUDI Wallet use cases.
					Explore how digital credentials work across identification, payments,
					travel, and more.
				</p>
				<div className="mt-10 flex items-center justify-center gap-4">
					<Button size="lg" asChild>
						<a href="#use-cases">
							Explore Use Cases
							<ArrowRight className="size-4" />
						</a>
					</Button>
					<Button size="lg" variant="outline" asChild>
						<a href="#how-it-works">Setup Guide</a>
					</Button>
				</div>
			</div>
		</section>
	);
}
