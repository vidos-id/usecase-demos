import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { checkSession } from "@/lib/auth";

export const Route = createFileRoute("/_auth")({
	beforeLoad: async () => {
		const isAuthenticated = await checkSession();
		if (!isAuthenticated) {
			throw redirect({ to: "/" });
		}
	},
	component: AuthLayout,
});

function AuthLayout() {
	return <Outlet />;
}
