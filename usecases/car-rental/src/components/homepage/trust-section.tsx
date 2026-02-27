import { CheckCircle, Clock, Lock, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeatureCard {
	icon: React.ReactNode;
	title: string;
	description: string;
	iconBg: string;
	iconColor: string;
}

const features: FeatureCard[] = [
	{
		icon: <Shield className="size-5" />,
		title: "Digital ID Verification",
		description:
			"Verify your identity using your EU Digital Identity Wallet. Compliant with eIDAS 2.0 regulations.",
		iconBg: "oklch(0.42 0.1 220 / 0.12)",
		iconColor: "var(--primary)",
	},
	{
		icon: <Lock className="size-5" />,
		title: "No Counter Required",
		description:
			"Self-service pickup with a secure locker PIN sent directly to your device. Skip the queue entirely.",
		iconBg: "oklch(0.78 0.16 75 / 0.15)",
		iconColor: "var(--amber)",
	},
	{
		icon: <CheckCircle className="size-5" />,
		title: "Selective Disclosure",
		description:
			"You control your data. Share only the attributes needed — age, licence class — nothing more.",
		iconBg: "oklch(0.55 0.15 160 / 0.12)",
		iconColor: "oklch(0.45 0.15 160)",
	},
	{
		icon: <Clock className="size-5" />,
		title: "Instant Processing",
		description:
			"Real-time policy-based verification. Approval in under two seconds, every time.",
		iconBg: "oklch(0.65 0.14 300 / 0.12)",
		iconColor: "oklch(0.55 0.14 300)",
	},
];

function FeatureItem({
	feature,
	index,
}: {
	feature: FeatureCard;
	index: number;
}) {
	const delayClass = [`delay-1`, `delay-2`, `delay-3`, `delay-4`][index] ?? "";

	return (
		<div
			className={cn(
				"animate-slide-up group rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm transition-shadow hover:shadow-md",
				delayClass,
			)}
		>
			<div
				className="mb-4 inline-flex size-11 items-center justify-center rounded-xl"
				style={{ background: feature.iconBg }}
			>
				<span style={{ color: feature.iconColor }}>{feature.icon}</span>
			</div>
			<h3 className="font-heading mb-2 text-base font-bold">{feature.title}</h3>
			<p className="text-sm leading-relaxed text-muted-foreground">
				{feature.description}
			</p>
		</div>
	);
}

export function TrustSection() {
	return (
		<section className="relative overflow-hidden py-20">
			{/* Background */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 60% 50% at 20% 50%, oklch(0.42 0.1 220 / 0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 50%, oklch(0.78 0.16 75 / 0.04) 0%, transparent 60%)",
				}}
			/>

			<div className="relative mx-auto max-w-7xl px-4 sm:px-6">
				{/* Header */}
				<div className="mb-12 text-center">
					<Badge
						variant="secondary"
						className="mb-3 font-mono text-xs uppercase tracking-wider"
					>
						Trust & Security
					</Badge>
					<h2 className="font-heading mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
						Verified Rentals, Zero Hassle
					</h2>
					<p className="mx-auto max-w-lg text-muted-foreground">
						Our Vidos Authorizer integration brings cutting-edge digital
						identity verification to car rental — secure, compliant, and
						effortless.
					</p>
				</div>

				{/* Feature cards */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((feature, index) => (
						<FeatureItem key={feature.title} feature={feature} index={index} />
					))}
				</div>

				{/* Bottom trust indicator */}
				<div className="mt-12 flex flex-col items-center gap-2 text-center">
					<div
						className="flex items-center gap-2 text-sm font-medium"
						style={{ color: "var(--primary)" }}
					>
						<Shield className="size-4" />
						<span>
							eIDAS 2.0 compliant · GDPR privacy-first · ISO 18013-5 mDL
						</span>
					</div>
					<p className="text-xs text-muted-foreground">
						Powered by Vidos Authorizer — the trusted identity verification
						platform
					</p>
				</div>
			</div>
		</section>
	);
}
