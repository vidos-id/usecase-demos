import { QRCodeSVG } from "qrcode.react";

type QrCodeProps = {
	className?: string;
	color?: string;
	backgroundColor?: string;
	level?: "L" | "M" | "Q" | "H";
	size?: number;
	value: string;
};

export function QrCode({
	backgroundColor = "#FFFFFF",
	className,
	color = "#111827",
	level = "M",
	size = 240,
	value,
}: QrCodeProps) {
	return (
		<QRCodeSVG
			value={value}
			size={size}
			level={level}
			bgColor={backgroundColor}
			fgColor={color}
			className={className}
		/>
	);
}
