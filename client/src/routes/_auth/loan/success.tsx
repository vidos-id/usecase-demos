import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/loan/success")({
	component: LoanSuccessPage,
});

function LoanSuccessPage() {
	return (
		<div className="max-w-xl mx-auto px-4 py-8">
			<Card>
				<CardHeader className="text-center">
					<div className="flex justify-center mb-4">
						<CheckCircle className="w-16 h-16 text-green-500" />
					</div>
					<CardTitle className="text-2xl">Application Submitted</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6 text-center">
					<p className="text-muted-foreground">
						We'll review your application and contact you within 2 business
						days.
					</p>

					<Button asChild className="w-full" size="lg">
						<Link to="/dashboard">Return to Dashboard</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
