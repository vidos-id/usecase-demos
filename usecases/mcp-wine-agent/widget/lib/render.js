import {
	buildInstructionText,
	buildStatusText,
	buildVerificationResult,
} from "./state.js";

function setHidden(element, hidden) {
	element.classList.toggle("hidden", hidden);
}

function renderQrCode(dom, qrSvg) {
	if (qrSvg) {
		dom.qrCodeEl.innerHTML = qrSvg;
		return;
	}

	dom.qrCodeEl.innerHTML = '<div class="placeholder">QR code loading.</div>';
}

function renderAuthorizationLink(dom, authorizeUrl, hideLink) {
	if (!authorizeUrl || hideLink) {
		setHidden(dom.authorizationLinkEl, true);
		dom.authorizationLinkEl.textContent = "";
		return;
	}

	setHidden(dom.authorizationLinkEl, false);
	dom.authorizationLinkEl.innerHTML = `<a class="wallet-link" href="${authorizeUrl}" target="_blank" rel="noreferrer">Open Vinos in wallet</a>`;
}

function renderVerificationResult(dom, data) {
	const result = buildVerificationResult(data);
	if (!result) {
		setHidden(dom.verificationResultEl, true);
		dom.verificationResultEl.innerHTML = "";
		return;
	}

	dom.verificationResultEl.className = `verification-result ${result.className}`;
	dom.verificationResultEl.innerHTML = [
		`<div class="result-icon">${result.icon}</div>`,
		`<div class="result-title">${result.title}</div>`,
		`<div class="result-detail">${result.detail}</div>`,
	].join("");
	setHidden(dom.verificationResultEl, false);
}

export function renderApp(dom, viewState) {
	const { data, qrSvg, authorizeUrl, paymentCompleted } = viewState;
	const isPaid = paymentCompleted || data?.status === "completed";
	const isVerified =
		data?.status === "verified" || data?.status === "completed";
	const showResult =
		isVerified ||
		data?.status === "rejected" ||
		data?.status === "expired" ||
		data?.status === "error";

	renderQrCode(dom, qrSvg);
	dom.instructionsTextEl.textContent = buildInstructionText(data);
	dom.statusEl.textContent = buildStatusText(data);
	renderVerificationResult(dom, data);
	renderAuthorizationLink(dom, authorizeUrl, isVerified);

	setHidden(dom.qrContainerEl, showResult);
	setHidden(dom.instructionsSectionEl, showResult);
	setHidden(dom.paymentPanelEl, !isVerified || isPaid);
	setHidden(dom.paymentSuccessEl, !isPaid);
	dom.checkoutButtonEl.disabled = isPaid;
	dom.checkoutButtonEl.textContent = isPaid ? "Paid" : "Pay now";
}
