import type { DomElements } from "./types";

function getRequiredElement<TElement extends HTMLElement>(
	id: string,
): TElement {
	const element = document.getElementById(id);
	if (!(element instanceof HTMLElement)) {
		throw new Error(`Missing required element: ${id}`);
	}

	return element as TElement;
}

export function createDomElements(): DomElements {
	return {
		qrCodeEl: getRequiredElement("qr-code"),
		qrContainerEl: getRequiredElement("qr-container"),
		statusEl: getRequiredElement("status"),
		instructionsTextEl: getRequiredElement("instructions-text"),
		instructionsSectionEl: getRequiredElement("instructions-section"),
		authorizationLinkEl: getRequiredElement("authorization-link"),
		verificationResultEl: getRequiredElement("verification-result"),
		paymentPanelEl: getRequiredElement("payment-panel"),
		checkoutButtonEl: getRequiredElement<HTMLButtonElement>("checkout-button"),
		paymentSuccessEl: getRequiredElement("payment-success"),
	};
}
