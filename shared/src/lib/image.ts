/**
 * Detects image MIME type from base64-encoded data by checking magic bytes.
 * Returns null if not a recognized image format.
 */
export function detectImageType(base64: string): string | null {
	if (!base64 || base64.length < 8) {
		return null;
	}

	// Extract first few bytes for magic number detection
	const header = base64.substring(0, 8);

	// JPEG: FF D8 FF
	if (header.startsWith("/9j/")) {
		return "image/jpeg";
	}

	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (header.startsWith("iVBORw")) {
		return "image/png";
	}

	// GIF: 47 49 46 38
	if (header.startsWith("R0lGOD")) {
		return "image/gif";
	}

	// WebP: RIFF...WEBP
	if (header.startsWith("UklGR")) {
		return "image/webp";
	}

	// BMP: 42 4D
	if (header.startsWith("Qk")) {
		return "image/bmp";
	}

	return null;
}

/**
 * Validates base64 string and returns data URL with detected MIME type.
 * Returns null if invalid or unrecognized format.
 */
export function getImageDataUrl(base64: string | undefined): string | null {
	if (!base64) {
		return null;
	}

	const mimeType = detectImageType(base64);
	if (!mimeType) {
		return null;
	}

	return `data:${mimeType};base64,${base64}`;
}
