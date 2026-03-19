type Props = {
	instructionText: string;
	authorizeUrl: string;
	hideLink: boolean;
	onOpenWallet: () => void;
};

export function Instructions({
	instructionText,
	authorizeUrl,
	hideLink,
	onOpenWallet,
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
				<button
					type="button"
					onClick={onOpenWallet}
					className="mt-6 inline-flex w-full cursor-pointer items-center justify-center rounded-2xl border-0 bg-[#722f37] px-6 py-4 text-center text-base font-semibold text-white shadow-[0_14px_34px_rgba(114,47,55,0.22)] transition-opacity hover:opacity-90 focus-visible:opacity-90"
				>
					Open Vinos in wallet
				</button>
			)}
		</div>
	);
}
