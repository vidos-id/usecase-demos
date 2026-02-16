import { EventEmitter } from "node:events";

/**
 * Typed application events.
 * Add new event types here as the application grows.
 */
export interface AppEventMap {
	/**
	 * Fired when an auth request transitions from "pending" to any final state.
	 * Used by callback resolver to avoid polling.
	 */
	authRequestResolved: {
		authorizationId: string;
		status: "completed" | "failed" | "expired";
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
