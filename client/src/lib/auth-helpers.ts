import type { PresentationMode } from "shared/types/auth";

export function isDCApiSupported(): boolean {
	return (
		typeof window !== "undefined" &&
		"credentials" in navigator &&
		"DigitalCredential" in window
	);
}

export function getStoredMode(): PresentationMode {
	return (
		(sessionStorage.getItem("authMode") as PresentationMode) || "direct_post"
	);
}

export function setStoredMode(mode: PresentationMode): void {
	sessionStorage.setItem("authMode", mode);
}
