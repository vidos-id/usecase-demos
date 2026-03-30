import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useLocation,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import {
	BookOpen,
	Bot,
	CalendarDays,
	Fingerprint,
	LayoutDashboard,
	LogOut,
	Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession, getSessionId } from "@/lib/auth";

export interface AuthenticatedUser {
	id: string;
	username: string;
	identityVerified: boolean;
	givenName: string | null;
	familyName: string | null;
	birthDate: string | null;
	hasActiveAgent: boolean;
	agentScopes: string[] | null;
	delegation: {
		delegationId: string;
		state:
			| "offer_ready"
			| "offer_redeeming"
			| "offer_expired"
			| "credential_received"
			| "credential_revoked";
		scopes: string[];
		validUntil: string | null;
		offerExpiresAt: string | null;
		offerRedeemedAt: string | null;
		credentialIssuedAt: string | null;
		credentialRevokedAt: string | null;
		credentialOfferUri: string | null;
		credentialOfferDeepLink: string | null;
		credentialStatus: {
			status_list: {
				idx: number;
				uri: string;
			};
		} | null;
		holderPublicKey: Record<string, unknown> | null;
	} | null;
}

export const Route = createFileRoute("/_app/_auth")({
	beforeLoad: async ({ context }) => {
		const { apiClient } = context;
		const sessionId = getSessionId();
		if (!sessionId) {
			throw redirect({ to: "/" });
		}

		const res = await apiClient.api.me.$get({});
		if (!res.ok) {
			clearSession();
			throw redirect({ to: "/" });
		}

		const user = await res.json();
		return { user: user as AuthenticatedUser };
	},
	component: AuthLayout,
});

/* ------------------------------------------------------------------ */
/*  Navigation config                                                  */
/* ------------------------------------------------------------------ */

const navItems = [
	{
		label: "Dashboard",
		to: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		label: "Events",
		to: "/events",
		icon: CalendarDays,
	},
	{
		label: "My Agent",
		to: "/agent",
		icon: Bot,
	},
	{
		label: "Identity",
		to: "/identity",
		icon: Fingerprint,
	},
	{
		label: "Bookings",
		to: "/bookings",
		icon: Ticket,
	},
] as const;

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

function AuthLayout() {
	const routeContext = useRouteContext({ from: "/_app/_auth" }) as {
		user: AuthenticatedUser;
	};
	const user = routeContext.user;
	const location = useLocation();
	const navigate = useNavigate();

	const handleSignOut = () => {
		clearSession();
		navigate({ to: "/" });
	};

	const activeTab = navItems.find(
		(item) =>
			location.pathname === item.to ||
			(item.to !== "/dashboard" && location.pathname.startsWith(`${item.to}/`)),
	);

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="sticky top-0 z-40 border-b border-border/50 bg-white/80 backdrop-blur-lg">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-[4.5rem] min-h-[4.5rem]">
						{/* Logo */}
						<Link to="/dashboard" className="flex items-center gap-3 group">
							<img
								src="/ticket-agent/vido-show-logo.svg"
								alt="VidoShow"
								className="h-11 w-11 rounded-2xl object-cover shadow-md shadow-primary/20 transition-transform duration-300 group-hover:scale-105"
							/>
							<div className="flex flex-col leading-none">
								<span className="font-brand text-[1.45rem] font-extrabold tracking-[-0.04em] text-foreground">
									VidoShow
								</span>
							</div>
						</Link>

						{/* User info + sign out */}
						<div className="flex items-center gap-3">
							<Link
								to="/guide"
								className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
							>
								<BookOpen className="h-4 w-4" />
								<span>Guide</span>
							</Link>
							<div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/40">
								<div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/80 to-violet-600 flex items-center justify-center">
									<span className="text-[10px] font-bold text-white uppercase">
										{user.username.charAt(0)}
									</span>
								</div>
								<span className="text-xs font-mono font-medium text-foreground/80">
									{user.username}
								</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleSignOut}
								className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-1.5 text-xs"
							>
								<LogOut className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">Sign Out</span>
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Navigation tabs */}
			<nav className="sticky top-16 z-30 border-b border-border/40 bg-white/60 backdrop-blur-md">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-none">
						{navItems.map((item) => {
							const isActive = item.to === activeTab?.to;

							return (
								<Link
									key={item.to}
									to={item.to}
									className={`
										relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
										${
											isActive
												? "text-primary"
												: "text-muted-foreground hover:text-foreground"
										}
									`}
								>
									<item.icon className="h-4 w-4" />
									<span>{item.label}</span>
									{/* Active indicator */}
									{isActive && (
										<span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary animate-fade-in" />
									)}
								</Link>
							);
						})}
					</div>
				</div>
			</nav>

			{/* Content */}
			<main className="flex-1">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
