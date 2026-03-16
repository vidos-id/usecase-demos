function getRequiredElement(id) {
	const element = document.getElementById(id);
	if (!element) {
		throw new Error(`Missing required element: ${id}`);
	}

	return element;
}

export function createDomElements() {
	return {
		qrCodeEl: getRequiredElement("qr-code"),
		qrContainerEl: getRequiredElement("qr-container"),
		statusEl: getRequiredElement("status"),
		instructionsTextEl: getRequiredElement("instructions-text"),
		instructionsSectionEl: getRequiredElement("instructions-section"),
		authorizationLinkEl: getRequiredElement("authorization-link"),
		verificationResultEl: getRequiredElement("verification-result"),
		paymentPanelEl: getRequiredElement("payment-panel"),
		checkoutButtonEl: getRequiredElement("checkout-button"),
		paymentSuccessEl: getRequiredElement("payment-success"),
	};
}
