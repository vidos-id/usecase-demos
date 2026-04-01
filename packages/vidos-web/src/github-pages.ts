export function restoreGithubPagesPath(basepath: string) {
	const params = new URLSearchParams(window.location.search);
	const ghPath = params.get("__gh_path");

	if (!ghPath) {
		return;
	}

	const ghSearch = params.get("__gh_search");
	const ghHash = params.get("__gh_hash");
	const restoredPath = decodeURIComponent(ghPath);
	const normalizedPath = restoredPath.startsWith("/")
		? restoredPath
		: `/${restoredPath}`;
	const restoredSearch = ghSearch ? decodeURIComponent(ghSearch) : "";
	const restoredHash = ghHash ? decodeURIComponent(ghHash) : "";

	window.history.replaceState(
		null,
		"",
		`${basepath}${normalizedPath}${restoredSearch}${restoredHash}`,
	);
}
