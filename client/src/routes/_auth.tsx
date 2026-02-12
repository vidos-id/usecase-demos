import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hcWithType } from "server/client";
import { AccountMenu } from "@/components/layout/account-menu";
import { getSessionId } from "@/lib/auth";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const client = hcWithType(SERVER_URL);

export const Route = createFileRoute("/_auth")({
	beforeLoad: async () => {
		const sessionId = getSessionId();
		if (!sessionId) {
			throw redirect({ to: "/" });
		}

		const res = await client.api.session.$get(
			{},
			{
				headers: { Authorization: `Bearer ${sessionId}` },
			},
		);

		if (!res.ok) {
			throw redirect({ to: "/" });
		}

		const data = await res.json();
		if (!data.authenticated) {
			throw redirect({ to: "/" });
		}

		return { session: data };
	},
	component: AuthLayout,
});

function AuthLayout() {
	return (
		<div className="min-h-screen flex flex-col">
			<header className="border-b bg-background sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
					<h1 className="text-xl font-bold">Banking App</h1>
					<AccountMenu />
				</div>
			</header>
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}
