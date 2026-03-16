import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root: path.resolve(ROOT_DIR, "widget"),
	base: "/widget-assets/",
	build: {
		outDir: path.resolve(ROOT_DIR, "widget/dist"),
		emptyOutDir: true,
		assetsDir: "assets",
		target: "es2022",
	},
});
