import { buildVerificationResult } from "../../lib/state";
import type { VerificationViewData } from "../../lib/types";

type Props = {
	data: VerificationViewData;
};

function CheckIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="white"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="h-8 w-8"
			aria-hidden="true"
		>
			<polyline points="20 6 9 17 4 12" />
		</svg>
	);
}

function XIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="white"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="h-8 w-8"
			aria-hidden="true"
		>
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	);
}

export function VerificationResult({ data }: Props) {
	const result = buildVerificationResult(data);
	if (!result) return null;

	const isSuccess = result.className === "result-success";

	return (
		<div
			className={[
				"flex flex-col items-center rounded-2xl border-2 p-8 text-center shadow-[0_18px_50px_rgba(114,47,55,0.12)]",
				"animate-[result-reveal_0.5s_cubic-bezier(0.22,1,0.36,1)_both]",
				isSuccess
					? "border-[#34a853] bg-gradient-to-br from-[#e8f9ee] to-[#d0f0db] text-[#145a28]"
					: "border-[#d93025] bg-gradient-to-br from-[#fde8e8] to-[#fad0d0] text-[#7a1a14]",
			].join(" ")}
		>
			<div
				className={[
					"mb-4 flex h-16 w-16 items-center justify-center rounded-full",
					"animate-[check-pop_0.45s_0.2s_cubic-bezier(0.34,1.56,0.64,1)_both]",
					isSuccess ? "bg-[#34a853]" : "bg-[#d93025]",
				].join(" ")}
			>
				{isSuccess ? <CheckIcon /> : <XIcon />}
			</div>
			<div
				className={[
					"mb-2 text-xl font-bold tracking-tight",
					isSuccess ? "text-[#145a28]" : "text-[#7a1a14]",
				].join(" ")}
			>
				{result.title}
			</div>
			<div className="text-sm leading-relaxed opacity-90">{result.detail}</div>
		</div>
	);
}
