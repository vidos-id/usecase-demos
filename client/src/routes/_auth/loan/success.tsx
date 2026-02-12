import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	CheckCircle2,
	Clock,
	FileText,
	ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/loan/success")({
	component: LoanSuccessPage,
});

function LoanSuccessPage() {
	return (
		<div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-lg mx-auto space-y-8">
				{/* Success animation */}
				<div className="text-center space-y-4 pt-8 animate-slide-up">
					<div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 mb-2">
						<CheckCircle2 className="h-10 w-10 text-green-500" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							Application Submitted
						</h1>
						<p className="text-muted-foreground mt-1">
							Your loan application has been received
						</p>
					</div>
				</div>

				{/* Status card */}
				<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
					<div className="p-6 space-y-4">
						<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
							What Happens Next
						</h2>

						<div className="space-y-4">
							<StatusStep
								icon={<ShieldCheck className="h-4 w-4" />}
								title="Identity Verified"
								description="Your PID credentials have been validated"
								completed
							/>
							<StatusStep
								icon={<FileText className="h-4 w-4" />}
								title="Application Review"
								description="Our team will review your application"
								current
							/>
							<StatusStep
								icon={<Clock className="h-4 w-4" />}
								title="Decision"
								description="You'll hear from us within 2 business days"
							/>
						</div>
					</div>

					{/* Demo notice */}
					<div className="px-6 py-4 bg-primary/5 border-t border-primary/20">
						<p className="text-sm text-primary">
							<span className="font-medium">Demo Mode:</span> Your balance and
							pending loans have been updated for demo purposes. The loan amount
							has been added to your activity.
						</p>
					</div>
				</div>

				{/* Info box */}
				<div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
							<ShieldCheck className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium">No Documents Needed</p>
							<p className="text-xs text-muted-foreground">
								Your verified PID credential provided all required identity
								information
							</p>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-3">
					<Button asChild variant="outline" className="flex-1">
						<Link to="/loan">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Apply Again
						</Link>
					</Button>
					<Button asChild className="flex-1">
						<Link to="/dashboard">Back to Dashboard</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function StatusStep({
	icon,
	title,
	description,
	completed = false,
	current = false,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	completed?: boolean;
	current?: boolean;
}) {
	return (
		<div className="flex items-start gap-3">
			<div
				className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
					completed
						? "bg-green-500/10 text-green-600"
						: current
							? "bg-primary/10 text-primary"
							: "bg-muted text-muted-foreground"
				}`}
			>
				{completed ? <CheckCircle2 className="h-4 w-4" /> : icon}
			</div>
			<div className="flex-1 min-w-0 pt-0.5">
				<p
					className={`text-sm font-medium ${completed ? "text-green-600" : current ? "text-foreground" : "text-muted-foreground"}`}
				>
					{title}
				</p>
				<p className="text-xs text-muted-foreground">{description}</p>
			</div>
		</div>
	);
}
