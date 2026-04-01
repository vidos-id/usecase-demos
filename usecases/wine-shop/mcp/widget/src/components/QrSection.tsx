import { QrCode } from "vidos-web/qr-code";

type Props = {
	authorizeUrl: string;
	statusText: string;
};

export function QrSection({ authorizeUrl, statusText }: Props) {
	return (
		<div className="flex w-full flex-col items-center gap-6 rounded-2xl border border-[rgba(114,47,55,0.1)] bg-white/96 p-6 shadow-[0_18px_50px_rgba(114,47,55,0.08)]">
			<div
				role="img"
				aria-label="QR Code for wallet verification"
				className="mx-auto flex aspect-square w-full max-w-[18rem] items-center justify-center overflow-hidden rounded-xl border-2 border-[rgba(114,47,55,0.14)] bg-white p-5"
			>
				{authorizeUrl ? (
					<QrCode
						value={authorizeUrl}
						size={240}
						color="#722F37"
						className="h-full w-full"
					/>
				) : (
					<p className="px-4 text-center text-sm leading-relaxed text-[rgba(45,24,16,0.6)]">
						Waiting for verification data...
					</p>
				)}
			</div>

			<div className="w-full rounded-xl bg-[rgba(114,47,55,0.07)] px-5 py-4 text-center text-sm leading-relaxed break-words text-[rgba(45,24,16,0.82)]">
				{statusText}
			</div>
		</div>
	);
}
