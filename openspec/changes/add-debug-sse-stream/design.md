## Context

The app is moving to SSE for authorization/callback updates, but developers and demo viewers still lack an in-app view of server-side execution details. Today that information is fragmented across server logs and route-specific console output, which slows debugging and weakens showcase narratives.

This change adds a dedicated debug SSE stream and UI console. It must reuse the same transport composition introduced for authorization SSE (typed envelope, serializer, channel routing) while keeping debug payload semantics isolated from business status payloads.

## Goals / Non-Goals

**Goals:**
- Provide a dedicated server-to-client debug stream for authorization and related request lifecycles.
- Keep payloads type-safe end-to-end with shared Zod schemas and inferred TS types.
- Deliver useful, moderately verbose events (clear enough for debugging and demos, but not noisy to the point of unusable output).
- Keep debug streaming architecture modular so adding new debug producers is low effort.
- Make data visibility demo-friendly; sensitive payload redaction is not required for this project.

**Non-Goals:**
- Replacing application observability with full tracing infrastructure.
- Coupling debug events with business SSE contracts.
- Building long-term persistent log storage/search in this change.

## Decisions

### 1) Add a dedicated debug channel over shared SSE transport
Decision:
- Expose a separate debug SSE endpoint/channel that reuses common SSE transport primitives.
- Keep business status channels (`authorization`, `callback`) and debug channel payloads separate.

Rationale:
- Shared transport reduces implementation duplication.
- Separate channels avoid accidental contract coupling and keep client state logic clean.

Alternative considered:
- Mix debug events into existing authorization/callback streams.
Why not:
- Blurs domain boundaries and complicates consumers that only need business state.

### 2) Use typed debug event schemas with a discriminated union
Decision:
- Define `sse-debug-event-console` contracts in `shared/src/api/` as a discriminated union (for example: `request_lifecycle`, `upstream_call`, `validation_error`, `state_transition`, `system`).
- Include common envelope fields: `eventType`, `level`, `timestamp`, `requestId?`, `flowType?`, `message`, `data`.
- Validate server emissions and client parsing with the same schema.

Rationale:
- Prevents drift between producers and consumers.
- Supports predictable client rendering and filtering.

Alternative considered:
- Unstructured JSON debug blobs.
Why not:
- Too brittle and hard to evolve safely.

### 3) Implement debug production via composable emitters, not ad-hoc `console.log`
Decision:
- Add a debug event emitter utility in server layer with small helpers per domain (auth requests, callback resolution, Vidos integration, store transitions).
- Route handlers/services call typed helpers instead of writing custom stream payloads inline.

Rationale:
- Keeps event shape consistent and code maintainable.
- Reduces duplication and accidental schema violations.

Alternative considered:
- Wrap/intercept all console output.
Why not:
- Produces noisy, inconsistent payloads and weak typing guarantees.

### 4) Keep verbosity controlled by level + category filters
Decision:
- Emit at levels (`info`, `warn`, `error`, `debug`) with curated event points only.
- Default client view shows `info|warn|error`; users can enable `debug`.
- Exclude very high-frequency low-value events (for example tight polling ticks) unless aggregated.

Rationale:
- Meets “verbose but not too verbose” requirement.
- Makes stream useful both for debugging and demos.

Alternative considered:
- Emit every internal operation unfiltered.
Why not:
- Overwhelms users and degrades signal-to-noise.

### 5) Provide a console-like client panel with bounded in-memory buffer
Decision:
- Add a reusable debug console component with:
  - live streaming list ordered by timestamp
  - level/category filters
  - pause/resume auto-scroll
  - clear action
- Expose the console as a dedicated panel that is toggleable from the client UI.
- Keep a bounded ring buffer (for example latest 500 events) in client memory.

Rationale:
- Matches debugging and showcase needs without adding backend storage complexity.
- Prevents unbounded memory growth in long demo sessions.

Alternative considered:
- Persist all debug logs server-side and query via API.
Why not:
- Out of scope for this change and not required for demo goals.

### 6) Scope debug streams to the active user session/request only
Decision:
- Debug stream subscriptions MUST be bound to the caller session identity and request correlation (`requestId`/flow context).
- Server MUST emit to a subscriber only events relevant to that subscriber's own requests.
- Server MUST NOT include debug events from other users/sessions in a subscriber stream.

Rationale:
- Preserves correctness and trust in debugging output.
- Prevents cross-user data exposure even in demo mode.

Alternative considered:
- Global shared debug stream for all server events.
Why not:
- Leaks unrelated activity and makes debugging noisy and unsafe.

## Risks / Trade-offs

- [Debug stream floods the UI under bursty workloads] -> Mitigation: bounded buffer, level filtering, optional batching of repetitive events.
- [Schema churn across producers] -> Mitigation: shared discriminated union with central emitter helpers and compile-time type checks.
- [Data leakage concerns outside demos] -> Mitigation: mark feature as demo-mode behavior and keep endpoint easy to gate/disable in future.
- [Dependency on shared SSE transport refactor] -> Mitigation: consume transport via stable module boundary; avoid direct cross-feature imports of business payload types.
- [Cross-user event leakage] -> Mitigation: session-bound subscription auth + server-side event filtering by owner session/request correlation before emit.

## Migration Plan

1. Add shared debug SSE schemas/types in `shared/src/api/`.
2. Add server debug emitter helpers and debug channel route using shared SSE transport utilities.
3. Add debug event instrumentation at key points in auth/callback/services/stores.
4. Build client debug console component and subscription hook with typed parsing and buffering.
5. Integrate console as a dedicated panel that can be toggled from client UI.
6. Validate event quality with representative flows (success, rejected, error, expired).
7. Validate isolation by running concurrent sessions and confirming each session only receives its own debug events.
8. Run type/lint checks and adjust event taxonomy if noisy.

Rollback:
- Remove debug route and client console wiring while keeping shared transport primitives intact.

## Open Questions

- None currently.
