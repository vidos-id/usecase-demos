import { useCallback, useEffect, useRef, useState } from "react";

type UseClipboardOptions = {
	resetAfterMs?: number;
	onError?: (error: unknown) => void;
	onSuccess?: (value: string) => void;
};

export function useClipboard(options: UseClipboardOptions = {}) {
	const { resetAfterMs = 2_500, onError, onSuccess } = options;
	const [copiedValue, setCopiedValue] = useState<string | null>(null);
	const timeoutRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) {
				window.clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const copy = useCallback(
		async (value: string, copiedStateValue = value) => {
			try {
				await navigator.clipboard.writeText(value);
				setCopiedValue(copiedStateValue);
				onSuccess?.(value);

				if (timeoutRef.current !== null) {
					window.clearTimeout(timeoutRef.current);
				}

				timeoutRef.current = window.setTimeout(() => {
					setCopiedValue((current: string | null) =>
						current === copiedStateValue ? null : current,
					);
					timeoutRef.current = null;
				}, resetAfterMs);
				return true;
			} catch (error) {
				onError?.(error);
				return false;
			}
		},
		[onError, onSuccess, resetAfterMs],
	);

	const isCopied = useCallback(
		(value: string) => copiedValue === value,
		[copiedValue],
	);

	return {
		copiedValue,
		copy,
		isCopied,
	};
}
