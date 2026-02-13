import { AlertCircle, AlertTriangle, ShieldX } from "lucide-react";
import type { AuthorizationErrorInfo } from "shared/types/vidos-errors";
import {
	getErrorUserMessage,
	vidosErrorTypes,
} from "shared/types/vidos-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface VidosErrorDisplayProps {
	errorInfo: AuthorizationErrorInfo;
	onRetry: () => void;
}

function getErrorIcon(errorType: string) {
	switch (errorType) {
		case vidosErrorTypes.credentialQuery:
			return <AlertCircle className="w-12 h-12 text-amber-600" />;
		case vidosErrorTypes.trustedIssuer:
			return <ShieldX className="w-12 h-12 text-destructive" />;
		default:
			return <AlertTriangle className="w-12 h-12 text-destructive" />;
	}
}

function getErrorBgColor(errorType: string) {
	switch (errorType) {
		case vidosErrorTypes.credentialQuery:
			return "bg-amber-500/10";
		case vidosErrorTypes.trustedIssuer:
			return "bg-destructive/10";
		default:
			return "bg-destructive/10";
	}
}

export function VidosErrorDisplay({
	errorInfo,
	onRetry,
}: VidosErrorDisplayProps) {
	const userMessage = getErrorUserMessage(errorInfo);

	return (
		<Card className="w-full max-w-2xl mx-auto animate-slide-up">
			<CardContent className="p-12">
				<div className="space-y-6">
					{/* Icon */}
					<div className="flex justify-center">
						<div
							className={`w-20 h-20 rounded-full ${getErrorBgColor(errorInfo.errorType)} flex items-center justify-center`}
						>
							{getErrorIcon(errorInfo.errorType)}
						</div>
					</div>

					{/* Title & Description */}
					<div className="space-y-3 text-center">
						<h3 className="text-2xl font-bold text-foreground">
							{userMessage.title}
						</h3>
						<p className="text-sm text-muted-foreground max-w-md mx-auto">
							{userMessage.description}
						</p>
						{userMessage.actionHint && (
							<p className="text-sm text-primary font-medium">
								{userMessage.actionHint}
							</p>
						)}
					</div>

					{/* Technical Details (for demo) */}
					{userMessage.technicalDetails &&
						userMessage.technicalDetails.length > 0 && (
							<div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
								<p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
									Technical Details
								</p>
								<ul className="space-y-1">
									{userMessage.technicalDetails.map((detail) => (
										<li
											key={detail}
											className="text-xs font-mono text-muted-foreground"
										>
											{detail}
										</li>
									))}
								</ul>
							</div>
						)}

					{/* Policy Info */}
					{errorInfo.policy && (
						<div className="flex justify-center">
							<span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-mono text-muted-foreground">
								Policy: {errorInfo.policy}
							</span>
						</div>
					)}

					{/* Retry Button */}
					<Button
						onClick={onRetry}
						variant="outline"
						className="w-full max-w-sm mx-auto block"
					>
						Try Again
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
