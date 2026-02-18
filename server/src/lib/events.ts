import { EventEmitter } from "node:events";
import type {
	AuthorizationFlowType,
	AuthorizationStreamEvent,
} from "shared/api/authorization-sse";
import type { DebugSseEvent } from "shared/api/debug-sse";

/**
 * Typed application events.
 * Add new event types here as the application grows.
 */
export interface AppEventMap {
	authorizationRequestEvent: {
		requestId: string;
		authorizationId: string;
		flowType: AuthorizationFlowType;
		event: AuthorizationStreamEvent;
	};

	/**
	 * Fired when an auth request transitions from "pending" to any final state.
	 * Used by callback streaming and other terminal waiters.
	 */
	authRequestResolved: {
		authorizationId: string;
		status: "completed" | "failed" | "expired";
	};

	debugEvent: {
		requestId: string;
		event: DebugSseEvent;
	};
}

/**
 * Strongly-typed event emitter for application-wide events.
 */
class TypedEventEmitter {
	private emitter = new EventEmitter();

	on<K extends keyof AppEventMap>(
		event: K,
		listener: (payload: AppEventMap[K]) => void,
	): void {
		this.emitter.on(event, listener);
	}

	off<K extends keyof AppEventMap>(
		event: K,
		listener: (payload: AppEventMap[K]) => void,
	): void {
		this.emitter.off(event, listener);
	}

	emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]): void {
		this.emitter.emit(event, payload);
	}

	once<K extends keyof AppEventMap>(
		event: K,
		listener: (payload: AppEventMap[K]) => void,
	): void {
		this.emitter.once(event, listener);
	}
}

/**
 * Singleton app event emitter instance.
 * Import and use throughout the application.
 */
export const appEvents = new TypedEventEmitter();
