type Props = {
	onPay: () => void;
	isPaid: boolean;
};

export function PaymentPanel({ onPay, isPaid }: Props) {
	return (
		<>
			{!isPaid && (
				<div className="w-full rounded-2xl border border-[rgba(114,47,55,0.12)] bg-gradient-to-b from-[#fffaf6] via-[#fffdfb] to-white p-6 shadow-[0_18px_50px_rgba(114,47,55,0.08)]">
					<h2 className="mb-2 text-center text-xl font-semibold tracking-tight text-[#722f37]">
						Complete your Vinos payment
					</h2>
					<p className="mb-5 text-center text-sm leading-relaxed text-[rgba(45,24,16,0.73)]">
						Verification is complete. Continue with payment below if the chat
						does not proceed automatically.
					</p>
					<div className="grid gap-4">
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="card-name"
								className="pl-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[rgba(45,24,16,0.56)]"
							>
								Cardholder
							</label>
							<input
								id="card-name"
								type="text"
								defaultValue="Ava Shopper"
								disabled
								className="w-full rounded-xl border border-[rgba(114,47,55,0.16)] bg-white px-4 py-3 text-sm text-[#2d1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] opacity-100"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="card-number"
								className="pl-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[rgba(45,24,16,0.56)]"
							>
								Card number
							</label>
							<input
								id="card-number"
								type="text"
								defaultValue="4242 4242 4242 4242"
								disabled
								className="w-full rounded-xl border border-[rgba(114,47,55,0.16)] bg-white px-4 py-3 text-sm text-[#2d1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] opacity-100"
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="card-expiry"
									className="pl-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[rgba(45,24,16,0.56)]"
								>
									Expiry
								</label>
								<input
									id="card-expiry"
									type="text"
									defaultValue="12/28"
									disabled
									className="w-full rounded-xl border border-[rgba(114,47,55,0.16)] bg-white px-4 py-3 text-sm text-[#2d1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] opacity-100"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="card-cvc"
									className="pl-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[rgba(45,24,16,0.56)]"
								>
									CVC
								</label>
								<input
									id="card-cvc"
									type="text"
									defaultValue="123"
									disabled
									className="w-full rounded-xl border border-[rgba(114,47,55,0.16)] bg-white px-4 py-3 text-sm text-[#2d1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] opacity-100"
								/>
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={onPay}
						className="mt-7 w-full cursor-pointer rounded-2xl border-0 bg-[#722f37] px-6 py-4 text-base font-bold text-white shadow-[0_14px_34px_rgba(114,47,55,0.22)] transition-all hover:opacity-92 disabled:cursor-default disabled:opacity-70"
					>
						Pay now
					</button>
				</div>
			)}

			{isPaid && (
				<div className="w-full rounded-2xl border border-[#b9e1c6] bg-[#eaf7ef] p-6 text-center text-sm leading-relaxed text-[#1f6a3a] shadow-[0_12px_32px_rgba(31,106,58,0.08)]">
					<strong className="mb-2 block text-base">Payment successful.</strong>
					Your Vinos order is confirmed and your wines will be shipped as soon
					as possible. Feel free to proceed with the chat.
				</div>
			)}
		</>
	);
}
