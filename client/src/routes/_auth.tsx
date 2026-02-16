import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { clearSession, getSessionId } from "@/lib/auth";

export const Route = createFileRoute("/_auth")({
	beforeLoad: async ({ context }) => {
		const { apiClient } = context;
		const sessionId = getSessionId();
		if (!sessionId) {
			throw redirect({ to: "/" });
		}

		const res = await apiClient.api.session.$get({});

		if (!res.ok) {
			clearSession();
			throw redirect({ to: "/" });
		}

		const data = await res.json();
		if (!data.authenticated) {
			clearSession();
			throw redirect({ to: "/" });
		}

		return { session: data };
	},
	component: AuthLayout,
});

function AuthLayout() {
	return <Outlet />;
}
