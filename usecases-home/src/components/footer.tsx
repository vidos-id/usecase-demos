import ecLogo from "../assets/logo-european-commission.svg";

export function Footer() {
	return (
		<footer className="border-t bg-card">
			<div className="container-page py-10">
				{/* Top row — brand + EU context */}
				<div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<div className="flex items-center gap-3">
							<img src="/vidos-logo.svg" alt="Vidos" className="h-5 w-auto" />
							<div className="h-4 w-px bg-border" />
							<span className="text-sm text-muted-foreground">
								EUDI Use Case Demos
							</span>
						</div>
						<p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
							Explore how the EU Digital Identity Wallet enables secure,
							privacy-preserving credential verification across borders.
						</p>
					</div>

					<div className="flex gap-10 text-sm">
						<div>
							<p className="font-semibold text-foreground mb-3">Resources</p>
							<ul className="space-y-2 text-muted-foreground">
								<li>
									<a
										href="https://vidos.id"
										target="_blank"
										rel="noopener noreferrer"
										className="transition-colors hover:text-eu-blue"
									>
										vidos.id
									</a>
								</li>
								<li>
									<a
										href="https://vidos.id/docs/"
										target="_blank"
										rel="noopener noreferrer"
										className="transition-colors hover:text-eu-blue"
									>
										Documentation
									</a>
								</li>
							</ul>
						</div>
						<div>
							<p className="font-semibold text-foreground mb-3">About</p>
							<ul className="space-y-2 text-muted-foreground">
								<li>
									<a
										href="https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET"
										target="_blank"
										rel="noopener noreferrer"
										className="transition-colors hover:text-eu-blue"
									>
										EUDI Wallet
									</a>
								</li>
								<li>
									<a
										href="https://github.com/nickreyntjens"
										target="_blank"
										rel="noopener noreferrer"
										className="transition-colors hover:text-eu-blue"
									>
										GitHub
									</a>
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Bottom bar */}
				<div className="mt-8 pt-6 border-t flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-xs text-muted-foreground">
						Built with Vidos verification infrastructure
					</p>
					<img
						src={ecLogo}
						alt="European Commission"
						className="h-8 w-auto opacity-60"
					/>
				</div>
			</div>
		</footer>
	);
}
