import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { CredentialsWorkspace } from "@/components/agent/credentials-workspace";
import type { AuthenticatedUser } from "../../_auth";

export const Route = createFileRoute("/_app/_auth/agent/onboard")({
	component: AgentOnboardPage,
});

function AgentOnboardPage() {
	const { user } = useRouteContext({ from: "/_app/_auth" }) as {
		user: AuthenticatedUser;
	};

	return <CredentialsWorkspace user={user} mode="onboard" />;
}
