import { useSyncExternalStore } from "react";
import { createBridge } from "../lib/bridge";
import type { WidgetToolPayload } from "../lib/types";

// Bridge singleton – created once for the app lifetime
export const bridge = createBridge();

// ---------------------------------------------------------------------------
// External-store subscription over the tool-output event stream
// ---------------------------------------------------------------------------

let _snapshot: WidgetToolPayload = bridge.getInitialToolOutput();
const _listeners = new Set<() => void>();

function notify(): void {
	for (const l of _listeners) l();
}

bridge.subscribeToToolOutput((payload) => {
	_snapshot = payload;
	notify();
});

function subscribe(listener: () => void): () => void {
	_listeners.add(listener);
	return () => {
		_listeners.delete(listener);
	};
}

function getSnapshot(): WidgetToolPayload {
	return _snapshot;
}

/** React hook – returns the latest raw tool output from the host. */
export function useToolOutput(): WidgetToolPayload {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
