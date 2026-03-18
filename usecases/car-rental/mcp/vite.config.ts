import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root: path.resolve(ROOT_DIR, "widget"),
	base: "./",
	plugins: [react(), tailwindcss(), viteSingleFile()],
	build: {
		outDir: path.resolve(ROOT_DIR, "widget/dist"),
		emptyOutDir: true,
		target: "es2022",
		cssCodeSplit: false,
	},
});
