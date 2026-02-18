## 1. Shared Debug Contracts

- [ ] 1.1 Add shared debug SSE schemas in `shared/src/api/debug-sse.ts` as discriminated unions with typed debug envelope fields (`eventType`, `level`, `timestamp`, `message`, scoped identifiers, payload).
- [ ] 1.2 Export inferred TypeScript types for debug events and add shared parsing/validation helpers consumed by server and client.
- [ ] 1.3 Add channel-separation contract definitions so debug payloads and business status payloads (`authorization-sse`, `callback-sse`) cannot be mixed.

## 2. Server Debug Stream and Emitters

- [ ] 2.1 Implement `/api/debug/stream/:requestId` SSE route/channel using existing shared SSE transport primitives (serializer, keepalive, disconnect cleanup).
- [ ] 2.2 Add server-side subscription scoping that binds each debug stream to caller session and request correlation.
- [ ] 2.3 Add per-request debug buffering in pending auth request store and replay buffered history on stream connect.
- [ ] 2.4 Add typed debug emitter helpers for key domains (auth lifecycle, callback resolution, Vidos calls, store state transitions).
- [ ] 2.5 Enforce server-side filtering so subscribers receive only events owned by their session/request scope.
- [ ] 2.6 Close debug stream when associated request reaches terminal state (`authorized`, `rejected`, `expired`, `error`).

## 3. Client Debug Console Panel

- [ ] 3.1 Implement a dedicated debug console panel component that is toggleable from the client UI.
- [ ] 3.2 Add typed EventSource subscription hook for debug channel with reconnect and parse-error handling.
- [ ] 3.3 Implement console behaviors: live event list, level/category filters, pause/resume auto-scroll, clear action.
- [ ] 3.4 Add bounded in-memory ring buffer for debug events and eviction policy for oldest entries.

## 4. Verbosity and Event Quality

- [ ] 4.1 Define curated debug emission points and levels (`info`, `warn`, `error`, `debug`) to keep output verbose but usable.
- [ ] 4.2 Set default visible levels to `info|warn|error` and support opt-in `debug` visibility in client panel.
- [ ] 4.3 Add optional aggregation/throttling for repetitive high-frequency events when noise exceeds usability threshold.

## 5. Validation and Isolation Testing

- [ ] 5.1 Add tests for debug event schema validation and channel contract enforcement.
- [ ] 5.2 Add tests that run concurrent sessions and verify no cross-user/cross-session debug event leakage.
- [ ] 5.3 Add flow tests verifying relevant debug events appear for success, rejected, error, and expired outcomes.
- [ ] 5.4 Add tests for late subscriber behavior to verify buffered history replay order and live-event continuation.
- [ ] 5.5 Run `bun run check-types` and `bun run lint` and fix issues introduced by this change.
