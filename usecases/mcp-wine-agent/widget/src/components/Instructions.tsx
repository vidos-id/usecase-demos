type Props = {
	instructionText: string;
	authorizeUrl: string;
	hideLink: boolean;
};

export function Instructions({
	instructionText,
	authorizeUrl,
	hideLink,
}: Props) {
	const showLink = !hideLink && authorizeUrl;

	return (
		<div className="w-full rounded-2xl border border-[rgba(114,47,55,0.08)] bg-[rgba(114,47,55,0.055)] p-6 text-sm leading-relaxed break-words text-[rgba(45,24,16,0.82)] shadow-[0_14px_38px_rgba(114,47,55,0.06)]">
			<strong className="mb-2 block text-base text-[#722f37]">
				Verify with your wallet
			</strong>
			<div className="text-sm leading-relaxed text-[rgba(45,24,16,0.82)]">
				{instructionText}
			</div>
			{showLink && (
				<a
					href={authorizeUrl}
					target="_blank"
					rel="noreferrer"
					className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[#722f37] px-6 py-4 text-center text-base font-semibold text-white no-underline shadow-[0_14px_34px_rgba(114,47,55,0.22)] transition-opacity hover:opacity-90 focus-visible:opacity-90"
				>
					Open Vinos in wallet
				</a>
			)}
		</div>
	);
}
