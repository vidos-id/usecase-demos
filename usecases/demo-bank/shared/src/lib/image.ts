/**
 * Detects image MIME type from base64-encoded data by checking magic bytes.
 * Returns null if not a recognized image format.
 */
export function detectImageType(base64: string): string | null {
	if (!base64 || base64.length < 8) {
		return null;
	}

	const header = base64.substring(0, 8);

	if (header.startsWith("/9j/") || header.startsWith("_9j_")) {
		return "image/jpeg";
	}

	if (header.startsWith("iVBORw0K") || header.startsWith("iVBORw")) {
		return "image/png";
	}

	if (header.startsWith("R0lGOD")) {
		return "image/gif";
	}

	if (header.startsWith("UklGR")) {
		return "image/webp";
	}

	if (header.startsWith("Qk")) {
		return "image/bmp";
	}

	return null;
}

function looksLikeBase64(value: string): boolean {
	if (value.length < 100) {
		return false;
	}

	return /^[A-Za-z0-9+/_-]+=*$/.test(value);
}

/**
 * Validates base64 string and returns data URL with detected MIME type.
 * Returns null if invalid or unrecognized format.
 */
export function getImageDataUrl(base64: string | undefined): string | null {
	if (!base64) {
		return null;
	}

	if (base64.startsWith("data:image/")) {
		return base64;
	}

	const standardBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");

	const mimeType = detectImageType(standardBase64);
	if (!mimeType) {
		return looksLikeBase64(standardBase64)
			? `data:image/jpeg;base64,${standardBase64}`
			: null;
	}

	return `data:${mimeType};base64,${standardBase64}`;
}
