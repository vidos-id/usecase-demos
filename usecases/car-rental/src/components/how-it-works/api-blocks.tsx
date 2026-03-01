// Shared visual primitives for the Vidos Authorizer API section

export function EndpointBlock({
	method,
	path,
	returns,
}: {
	method: "GET" | "POST";
	path: string;
	returns?: string;
}) {
	const methodColor =
		method === "POST" ? "oklch(0.42 0.1 220)" : "oklch(0.55 0.16 145)";

	return (
		<div className="mt-3 overflow-hidden rounded-lg border border-border/50 bg-muted/30 font-mono text-xs">
			<div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
				<span
					className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider"
					style={{ background: `${methodColor}20`, color: methodColor }}
				>
					{method}
				</span>
				<span className="text-foreground/80">{path}</span>
			</div>
			{returns && (
				<div className="px-3 py-2 text-muted-foreground">
					<span className="text-muted-foreground/60">→ </span>
					{returns}
				</div>
			)}
		</div>
	);
}

export function ClaimsBadgeRow() {
	const claims = [
		"given_name",
		"family_name",
		"birth_date",
		"document_number",
		"expiry_date",
		"portrait",
	];
	return (
		<div className="mt-3 flex flex-wrap gap-1.5">
			{claims.map((claim) => (
				<span
					key={claim}
					className="rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
				>
					{claim}
				</span>
			))}
		</div>
	);
}

export function StatusBadgeRow() {
	const statuses = [
		{ label: "pending_wallet", color: "oklch(0.65 0.15 60)" },
		{ label: "authorized", color: "oklch(0.52 0.16 145)" },
		{ label: "rejected", color: "oklch(0.55 0.18 25)" },
		{ label: "expired", color: "oklch(0.55 0.1 280)" },
		{ label: "error", color: "oklch(0.5 0.1 0)" },
	] as const;

	return (
		<div className="mt-3 flex flex-wrap gap-1.5">
			{statuses.map(({ label, color }) => (
				<span
					key={label}
					className="rounded-md border px-2 py-0.5 font-mono text-[11px]"
					style={{
						borderColor: `${color}40`,
						background: `${color}12`,
						color,
					}}
				>
					{label}
				</span>
			))}
		</div>
	);
}
