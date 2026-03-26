import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowRight,
	KeyRound,
	Loader2,
	LogIn,
	Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSessionId } from "@/lib/auth";

export const Route = createFileRoute("/_app/signin")({
	component: SigninPage,
});

function SigninPage() {
	const navigate = useNavigate();
	const { apiClient } = Route.useRouteContext();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const signinMutation = useMutation({
		mutationFn: async () => {
			const res = await apiClient.api.signin.$post({
				json: { username, password },
			});

			if (res.status === 401) {
				throw new Error("Invalid credentials");
			}

			if (!res.ok) {
				throw new Error("Something went wrong. Please try again.");
			}

			return res.json();
		},
		onSuccess: (data) => {
			setSessionId(data.sessionId);
			navigate({ to: "/dashboard" });
		},
		onError: (err) => {
			setError(err.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!username.trim()) {
			setError("Please enter your username");
			return;
		}
		if (!password) {
			setError("Please enter your password");
			return;
		}

		signinMutation.mutate();
	};

	return (
		<div className="relative min-h-screen flex items-center justify-center px-4 py-16">
			{/* Background */}
			<div className="absolute inset-0 -z-10">
				<div className="absolute inset-0 bg-gradient-to-br from-violet-50/80 via-background to-amber-50/30" />
				<div className="absolute top-[-15%] right-[10%] h-[500px] w-[500px] rounded-full bg-violet-200/25 blur-3xl" />
				<div className="absolute bottom-[-10%] left-[5%] h-[400px] w-[400px] rounded-full bg-amber-200/15 blur-3xl" />
				{/* Dot grid */}
				<div
					className="absolute inset-0 opacity-[0.025]"
					style={{
						backgroundImage:
							"radial-gradient(circle, currentColor 1px, transparent 1px)",
						backgroundSize: "24px 24px",
					}}
				/>
			</div>

			<div className="w-full max-w-md animate-slide-up">
				{/* Trust header */}
				<div className="text-center mb-8 space-y-4">
					<img
						src="/ticket-agent/vido-show-logo.svg"
						alt="VidoShow"
						className="h-20 w-20 mx-auto rounded-[1.75rem] object-cover shadow-xl shadow-primary/25"
					/>
					<div className="space-y-1.5">
						<p className="font-brand text-[2rem] font-extrabold leading-none tracking-[-0.05em] text-foreground">
							VidoShow
						</p>
						<p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary/70">
							Live access, delegated
						</p>
					</div>
					<h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
					<p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
						Sign in to VidoShow to manage your AI agent and browse upcoming
						events.
					</p>
				</div>

				{/* Signin Card */}
				<Card className="border-border/50 shadow-xl shadow-violet-900/[0.03] bg-white/80 backdrop-blur-sm">
					<CardHeader className="pb-4">
						<CardTitle className="text-base flex items-center gap-2">
							<LogIn className="h-4 w-4 text-primary" />
							Sign In
						</CardTitle>
						<CardDescription>
							Enter your credentials to access your account.
						</CardDescription>
					</CardHeader>

					<form onSubmit={handleSubmit}>
						<CardContent className="space-y-4">
							{/* Error */}
							{error && (
								<div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-destructive/5 border border-destructive/15 animate-slide-up">
									<AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
									<p className="text-sm text-destructive">{error}</p>
								</div>
							)}

							{/* Username */}
							<div className="space-y-2">
								<Label
									htmlFor="username"
									className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
								>
									Username
								</Label>
								<Input
									id="username"
									type="text"
									placeholder="Your username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									autoComplete="username"
									autoFocus
									disabled={signinMutation.isPending}
									className="h-11 bg-background/60 border-border/60 focus-visible:border-primary/40 transition-colors"
								/>
							</div>

							{/* Password */}
							<div className="space-y-2">
								<Label
									htmlFor="password"
									className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
								>
									Password
								</Label>
								<Input
									id="password"
									type="password"
									placeholder="Your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									autoComplete="current-password"
									disabled={signinMutation.isPending}
									className="h-11 bg-background/60 border-border/60 focus-visible:border-primary/40 transition-colors"
								/>
							</div>
						</CardContent>

						<CardFooter className="flex-col gap-4 pt-2">
							<Button
								type="submit"
								className="w-full h-11 text-sm font-semibold group bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-700/90 shadow-md shadow-primary/15"
								disabled={signinMutation.isPending}
							>
								{signinMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Signing in…
									</>
								) : (
									<>
										Sign In
										<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
									</>
								)}
							</Button>
						</CardFooter>
					</form>
				</Card>

				{/* Sign Up link */}
				<p className="text-center text-sm text-muted-foreground mt-6">
					Don&apos;t have an account?{" "}
					<Link
						to="/signup"
						className="font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4 decoration-primary/30 hover:decoration-primary/60"
					>
						Sign Up
					</Link>
				</p>

				{/* Trust badges */}
				<div className="flex items-center justify-center gap-5 mt-8">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
						<Sparkles className="h-3 w-3" />
						<span>AI Agent Delegation</span>
					</div>
					<div className="h-3 w-px bg-border/60" />
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
						<KeyRound className="h-3 w-3" />
						<span>Verifiable Credentials</span>
					</div>
				</div>
			</div>
		</div>
	);
}
