import { createContext, type ReactNode, useContext, useState } from "react";

type DebugConsoleContextValue = {
	requestId: string | null;
	debugSessionId: string | undefined;
	setDebugInfo: (requestId: string | null, debugSessionId?: string) => void;
};

const DebugConsoleContext = createContext<DebugConsoleContextValue | null>(
	null,
);

export function DebugConsoleProvider({ children }: { children: ReactNode }) {
	const [requestId, setRequestId] = useState<string | null>(null);
	const [debugSessionId, setDebugSessionId] = useState<string | undefined>(
		undefined,
	);

	const setDebugInfo = (
		newRequestId: string | null,
		newDebugSessionId?: string,
	) => {
		setRequestId(newRequestId);
		setDebugSessionId(newDebugSessionId);
	};

	return (
		<DebugConsoleContext.Provider
			value={{ requestId, debugSessionId, setDebugInfo }}
		>
			{children}
		</DebugConsoleContext.Provider>
	);
}

export function useDebugConsole() {
	const context = useContext(DebugConsoleContext);
	if (!context) {
		throw new Error("useDebugConsole must be used within DebugConsoleProvider");
	}
	return context;
}
