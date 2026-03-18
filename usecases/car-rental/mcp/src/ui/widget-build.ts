import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UI_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(UI_DIR, "../..");
const WIDGET_HTML_PATH = path.join(PACKAGE_ROOT, "widget/dist/index.html");

export async function ensureWidgetBuilt(): Promise<void> {
	const skipBuild =
		process.env.SKIP_WIDGET_BUILD === "1" || (await hasWidgetBuild());
	if (skipBuild) {
		return;
	}

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

async function hasWidgetBuild(): Promise<boolean> {
	try {
		await access(WIDGET_HTML_PATH);
		return true;
	} catch {
		return false;
	}
}

export async function getBuiltWidgetHtml(): Promise<string> {
	return await readFile(WIDGET_HTML_PATH, "utf8");
}
