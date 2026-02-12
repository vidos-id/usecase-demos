import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hcWithType } from "server/client";
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
	return <Outlet />;
}
