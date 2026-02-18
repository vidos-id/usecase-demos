## 1. Shared Debug Contracts

- [x] 1.1 Add shared debug SSE schemas in `shared/src/api/debug-sse.ts` as discriminated unions with typed debug envelope fields (`eventType`, `level`, `timestamp`, `message`, scoped identifiers, payload).
- [x] 1.2 Export inferred TypeScript types for debug events and add shared parsing/validation helpers consumed by server and client.
- [x] 1.3 Add channel-separation contract definitions so debug payloads and business status payloads (`authorization-sse`, `callback-sse`) cannot be mixed.

## 2. Server Debug Stream and Emitters

- [x] 2.1 Implement `/api/debug/stream/:requestId` SSE route/channel using existing shared SSE transport primitives (serializer, keepalive, disconnect cleanup).
- [x] 2.2 Add server-side subscription scoping that binds each debug stream to caller session and request correlation.
- [x] 2.3 Add per-request debug buffering in pending auth request store and replay buffered history on stream connect.
- [x] 2.4 Add typed debug emitter helpers for key domains (auth lifecycle, callback resolution, Vidos calls, store state transitions).
- [x] 2.5 Enforce server-side filtering so subscribers receive only events owned by their session/request scope.
- [x] 2.6 Close debug stream when associated request reaches terminal state (`authorized`, `rejected`, `expired`, `error`).

## 3. Client Debug Console Panel

- [x] 3.1 Implement a dedicated debug console panel component that is toggleable from the client UI.
- [x] 3.2 Add typed EventSource subscription hook for debug channel with reconnect and parse-error handling.
- [x] 3.3 Implement console behaviors: live event list, level/category filters, pause/resume auto-scroll, clear action.
- [x] 3.4 Add bounded in-memory ring buffer for debug events and eviction policy for oldest entries.

## 4. Verbosity and Event Quality

- [x] 4.1 Define curated debug emission points and levels (`info`, `warn`, `error`, `debug`) to keep output verbose but usable.
- [x] 4.2 Set default visible levels to `info|warn|error` and support opt-in `debug` visibility in client panel.
- [x] 4.3 Add optional aggregation/throttling for repetitive high-frequency events when noise exceeds usability threshold.

## 5. Validation and Isolation Testing

- [x] 5.1 Add tests for debug event schema validation and channel contract enforcement.
- [x] 5.2 Add tests that run concurrent sessions and verify no cross-user/cross-session debug event leakage.
- [x] 5.3 Add flow tests verifying relevant debug events appear for success, rejected, error, and expired outcomes.
- [x] 5.4 Add tests for late subscriber behavior to verify buffered history replay order and live-event continuation.
- [x] 5.5 Run `bun run check-types` and `bun run lint` and fix issues introduced by this change.
