import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
	return (
		<section className="relative overflow-hidden bg-eu-blue text-eu-blue-foreground">
			{/* Background decoration — faint star ring */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<EuStarRing
					className="absolute -top-20 -right-20 opacity-[0.06]"
					size={400}
				/>
				<EuStarRing
					className="absolute -bottom-32 -left-32 opacity-[0.04]"
					size={500}
				/>
			</div>

			<div className="relative container-page py-20 lg:py-28">
				<div className="max-w-3xl">
					<p className="text-sm font-medium tracking-wider uppercase opacity-70 mb-6">
						EU Digital Identity Wallet
					</p>

					<h1 className="heading-mixed text-eu-blue-foreground !text-4xl sm:!text-5xl lg:!text-[3.5rem] leading-tight">
						Get up to speed with <strong>EUDI use case demos</strong>
					</h1>

					<p className="mt-6 text-lg leading-relaxed opacity-80 max-w-2xl">
						Interactive demonstrations of real-world EUDI Wallet use cases.
						Explore how verifiable credentials work across identification,
						payments, travel, and more.
					</p>

					<div className="mt-10 flex flex-wrap items-center gap-4">
						<Button
							size="lg"
							className="bg-white text-eu-blue font-semibold hover:bg-white/90 rounded-lg"
							asChild
						>
							<a href="#use-cases">
								Explore Use Cases
								<ArrowRight className="size-4" />
							</a>
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-lg"
							asChild
						>
							<a href="#how-it-works">
								Setup Guide
								<ChevronRight className="size-4" />
							</a>
						</Button>
					</div>
				</div>
			</div>

			{/* Bottom curve — soft transition into content */}
			<div className="h-6 bg-background rounded-t-[2rem]" />
		</section>
	);
}

function EuStarRing({
	className,
	size = 300,
}: {
	className?: string;
	size?: number;
}) {
	const stars = 12;
	const r = size * 0.4;
	const c = size / 2;
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-hidden="true"
		>
			<circle
				cx={c}
				cy={c}
				r={r}
				stroke="oklch(0.88 0.17 90)"
				strokeWidth="1.5"
				fill="none"
			/>
			{Array.from({ length: stars }).map((_, i) => {
				const angle = (i * 360) / stars - 90;
				const rad = (angle * Math.PI) / 180;
				const x = c + r * Math.cos(rad);
				const y = c + r * Math.sin(rad);
				return (
					<Star
						key={`star-${x.toFixed(1)}-${y.toFixed(1)}`}
						cx={x}
						cy={y}
						size={size * 0.04}
					/>
				);
			})}
		</svg>
	);
}

function Star({ cx, cy, size }: { cx: number; cy: number; size: number }) {
	const points = 5;
	const outer = size;
	const inner = size * 0.4;
	const d = Array.from({ length: points * 2 })
		.map((_, i) => {
			const r = i % 2 === 0 ? outer : inner;
			const angle = (i * Math.PI) / points - Math.PI / 2;
			const x = cx + r * Math.cos(angle);
			const y = cy + r * Math.sin(angle);
			return `${i === 0 ? "M" : "L"}${x},${y}`;
		})
		.join(" ");
	return <path d={`${d}Z`} fill="oklch(0.88 0.17 90)" />;
}
