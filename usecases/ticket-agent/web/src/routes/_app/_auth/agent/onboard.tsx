import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { Check, Copy, ExternalLink, Terminal } from "lucide-react";
import { toast } from "sonner";
import { useClipboard } from "vidos-web/clipboard";
import { CredentialsWorkspace } from "@/components/agent/credentials-workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AuthenticatedUser } from "../../_auth";

const openClawSkillUrl =
	"https://raw.githubusercontent.com/vidos-id/usecase-demos/main/usecases/ticket-agent/server/skill.md";

const openClawBootstrapPrompt = `Read ${openClawSkillUrl} and follow the instructions for this session.`;

export const Route = createFileRoute("/_app/_auth/agent/onboard")({
	component: AgentOnboardPage,
});

function AgentOnboardPage() {
	const { user } = useRouteContext({ from: "/_app/_auth" }) as {
		user: AuthenticatedUser;
	};
	const { copy, isCopied } = useClipboard({
		onSuccess: () => toast.success("Bootstrap prompt copied"),
		onError: () => toast.error("Failed to copy to clipboard"),
	});
	const copied = isCopied(openClawBootstrapPrompt);
	const copyBootstrapPrompt = () => copy(openClawBootstrapPrompt);

	return (
		<div className="space-y-6">
			<Card className="border-border/60 bg-white/60 shadow-lg shadow-primary/[0.03]">
				<CardContent className="p-6 space-y-5">
					<div className="space-y-2">
						<p className="text-xs font-mono uppercase tracking-[0.2em] text-primary/70">
							How onboarding works
						</p>
						<h2 className="text-lg font-semibold tracking-tight">
							Start the agent conversation first
						</h2>
						<p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
							Send the bootstrap prompt to OpenClaw, let it initialize its
							wallet, then create a booking-only delegation offer below and send
							that OID4VCI offer URI or deep link back to the same conversation.
						</p>
					</div>

					<div className="rounded-2xl border border-border/50 bg-muted/20 overflow-hidden">
						<div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3">
							<div className="flex items-center gap-2.5">
								<Terminal className="h-4 w-4 text-primary/70" />
								<p className="text-sm font-semibold tracking-tight">
									OpenClaw bootstrap prompt
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={copyBootstrapPrompt}
								className="h-8"
							>
								{copied ? (
									<Check className="h-3.5 w-3.5" />
								) : (
									<Copy className="h-3.5 w-3.5" />
								)}
								{copied ? "Copied" : "Copy"}
							</Button>
						</div>
						<div className="p-4">
							<pre className="rounded-xl bg-gray-900 border border-gray-800 p-4 font-mono text-xs text-gray-100 leading-relaxed whitespace-pre-wrap break-all select-all">
								{openClawBootstrapPrompt}
							</pre>
						</div>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-muted-foreground leading-relaxed">
							Need the full walkthrough? The guide covers identity verification,
							wallet bootstrap, delegation issuance, and how to share the offer
							with the agent.
						</p>
						<Button asChild variant="outline" className="shrink-0">
							<Link to="/guide">
								Open full guide
								<ExternalLink className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			<CredentialsWorkspace user={user} mode="onboard" />
		</div>
	);
}
