import path from "node:path";
import { getWidgetDistDir } from "@/ui/widget-build";
import { WIDGET_ASSETS_ROUTE } from "@/ui/widget-config";

function resolveAssetPath(requestPath: string): string | null {
	if (!requestPath.startsWith(`${WIDGET_ASSETS_ROUTE}/`)) {
		return null;
	}

	const relativePath = decodeURIComponent(
		requestPath.slice(WIDGET_ASSETS_ROUTE.length + 1),
	);
	const normalizedPath = path.normalize(relativePath);
	if (normalizedPath.startsWith("..") || path.isAbsolute(normalizedPath)) {
		return null;
	}

	return path.join(getWidgetDistDir(), normalizedPath);
}

export async function serveWidgetAsset(
	requestPath: string,
): Promise<Response | null> {
	const assetPath = resolveAssetPath(requestPath);
	if (!assetPath) {
		return null;
	}

	const file = Bun.file(assetPath);
	if (!(await file.exists())) {
		return new Response("Not found", { status: 404 });
	}

	return new Response(file);
}
