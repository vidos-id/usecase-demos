import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
	useRouteContext,
} from "@tanstack/react-router";
import { Bot, Fingerprint, KeyRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AuthenticatedUser } from "../_auth";

export const Route = createFileRoute("/_app/_auth/agent")({
	component: AgentLayout,
});

function AgentLayout() {
	const { user } = useRouteContext({ from: "/_app/_auth" }) as {
		user: AuthenticatedUser;
	};
	const location = useLocation();

	if (!user.identityVerified) {
		return <IdentityGate />;
	}

	const subnavItems = [
		{ label: "Credentials", to: "/agent", icon: KeyRound },
		{ label: "Onboard", to: "/agent/onboard", icon: Plus },
	] as const;

	return (
		<div className="space-y-6 animate-slide-up">
			<div>
				<div className="flex items-center gap-2 mb-1">
					<Bot className="h-4 w-4 text-primary/50" />
					<p className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest">
						Agent
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Agent Credentials
				</h1>
				<p className="text-muted-foreground text-sm mt-1 max-w-2xl leading-relaxed">
					Manage delegated credentials and onboard additional agent wallets.
				</p>
			</div>

			<div className="flex items-center gap-1.5">
				{subnavItems.map((item) => {
					const isActive =
						location.pathname === item.to ||
						(item.to !== "/agent" &&
							location.pathname.startsWith(`${item.to}/`));

					return (
						<Link
							key={item.to}
							to={item.to}
							className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
								isActive
									? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
									: "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
							}`}
						>
							<item.icon className="h-3.5 w-3.5" />
							<span>{item.label}</span>
						</Link>
					);
				})}
			</div>

			<Outlet />
		</div>
	);
}

function IdentityGate() {
	return (
		<div className="space-y-8 animate-slide-up">
			<div>
				<div className="flex items-center gap-2 mb-1">
					<Bot className="h-4 w-4 text-primary/50" />
					<p className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest">
						Agent
					</p>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Onboard Agent Wallets
				</h1>
				<p className="text-muted-foreground text-sm mt-1 max-w-lg leading-relaxed">
					Verify your identity before issuing delegated credentials to agent
					wallets.
				</p>
			</div>

			<div className="max-w-2xl">
				<Card className="border-amber-200/60 bg-amber-50/30 shadow-lg shadow-amber-900/[0.03]">
					<CardContent className="p-8">
						<div className="flex flex-col items-center text-center space-y-5">
							<div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-200/50 shadow-sm">
								<Fingerprint className="h-8 w-8 text-amber-600" />
							</div>
							<div className="space-y-2">
								<h2 className="text-lg font-semibold tracking-tight">
									Identity Verification Required
								</h2>
								<p className="text-sm text-muted-foreground leading-relaxed max-w-md">
									Verify your identity with a PID credential before creating
									delegated agent credentials.
								</p>
							</div>
							<Button asChild className="h-11 px-6 text-sm font-semibold group">
								<Link to="/identity">
									<Fingerprint className="h-4 w-4" />
									Verify Identity
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
