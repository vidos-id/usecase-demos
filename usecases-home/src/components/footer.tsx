import { Separator } from "@/components/ui/separator";

export function Footer() {
	return (
		<footer className="border-t bg-background">
			<div className="container-page py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span className="font-semibold text-foreground">Vidos</span>
					<Separator orientation="vertical" className="h-4" />
					<span>EUDI Use Case Demos</span>
				</div>
				<div className="flex items-center gap-6 text-sm text-muted-foreground">
					<a
						href="https://vidos.id"
						className="transition-colors hover:text-foreground"
					>
						vidos.id
					</a>
					<a href="#" className="transition-colors hover:text-foreground">
						Documentation
					</a>
					<a href="#" className="transition-colors hover:text-foreground">
						GitHub
					</a>
				</div>
			</div>
		</footer>
	);
}
