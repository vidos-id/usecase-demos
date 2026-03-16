import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UI_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(UI_DIR, "../..");
const WIDGET_ROOT = path.join(PACKAGE_ROOT, "widget");
const WIDGET_DIST_DIR = path.join(WIDGET_ROOT, "dist");
const WIDGET_HTML_PATH = path.join(WIDGET_DIST_DIR, "index.html");

export function getWidgetDistDir(): string {
	return WIDGET_DIST_DIR;
}

export async function ensureWidgetBuilt(): Promise<void> {
	const command = Bun.spawn({
		cmd: ["bunx", "vite", "build", "--config", "vite.config.ts"],
		cwd: PACKAGE_ROOT,
		stdout: "inherit",
		stderr: "inherit",
	});

	const exitCode = await command.exited;
	if (exitCode !== 0) {
		throw new Error(`Widget build failed with exit code ${exitCode}`);
	}
}

export async function getBuiltWidgetHtml(): Promise<string> {
	const html = await readFile(WIDGET_HTML_PATH, "utf8");
	return await inlineBuiltAssets(html);
}

async function inlineBuiltAssets(html: string): Promise<string> {
	let inlinedHtml = html;

	const stylesheetMatches = [
		...html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g),
	];
	for (const match of stylesheetMatches) {
		const assetPath = match[1];
		if (!assetPath) {
			continue;
		}

		const assetContents = await readBuiltAsset(assetPath);
		inlinedHtml = inlinedHtml.replace(
			match[0],
			`<style>${assetContents}</style>`,
		);
	}

	const scriptMatches = [
		...html.matchAll(
			/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
		),
	];
	for (const match of scriptMatches) {
		const assetPath = match[1];
		if (!assetPath) {
			continue;
		}

		const assetContents = await readBuiltAsset(assetPath);
		inlinedHtml = inlinedHtml.replace(
			match[0],
			`<script type="module">${assetContents}</script>`,
		);
	}

	return inlinedHtml;
}

async function readBuiltAsset(assetPath: string): Promise<string> {
	const relativeAssetPath = assetPath.replace(/^\/+widget-assets\//, "");
	const absoluteAssetPath = path.join(WIDGET_DIST_DIR, relativeAssetPath);
	return await readFile(absoluteAssetPath, "utf8");
}
