## Context

The current implementation uses client polling (`/status/:requestId`) and, inside those handlers, server-side polling to the Vidos Authorizer API (`pollAuthorizationStatus`). This creates repeated network traffic and ties progress checks to request/response endpoints instead of a server-owned authorization monitor.  

The server already has an internal event mechanism (`appEvents`) and pending-request lifecycle updates (`pending_auth_requests` status transitions). Those can be used as the source of truth for push updates via SSE. The callback resolver already waits on internal events, which confirms the architecture can be event-driven end-to-end.

## Goals / Non-Goals

**Goals:**
- Remove client polling entirely for authorization and callback progress.
- Keep authorization progress handling server-driven and independent from client presence.
- Provide server-to-client real-time status updates using SSE for auth flows and callback flow.
- Preserve existing flow semantics (pending, completed/authorized, rejected/error/expired) and error information.
- Enforce strict type safety for SSE event payloads across `shared`, `server`, and `client`.

**Non-Goals:**
- Replacing Vidos integration primitives for request creation, callback resolution, or DC API forwarding.
- Introducing WebSockets or third-party realtime infrastructure.
- Redesigning unrelated UI behavior outside status transport changes.

## Decisions

### 1) Use SSE streams keyed by request identifiers
Decision:
- Add SSE endpoints in server routes for:
  - Authorization request status stream (`requestId` scoped).
  - Callback resolution stream (`response_code` scoped from callback query params).

Rationale:
- SSE is sufficient for one-way server push, native in browsers (`EventSource`), and simpler than WebSockets.
- Request-scoped streams limit event fan-out and reduce filtering complexity.

Alternative considered:
- WebSockets for bidirectional messaging.
Why not:
- Adds protocol complexity and connection lifecycle management that is unnecessary for this use case.

### 2) Keep server-side authorization progression independent from SSE subscribers
Decision:
- Keep a server-managed authorization monitor that tracks pending requests and updates request state regardless of active client connections.
- Polling/check progression is triggered by server lifecycle (request creation + background monitor), not by client status endpoints.
- Callback/direct_post and DC API completion update the same pending-request state machine and emit the same domain events.

Rationale:
- Real-world flow completion is server-owned; clients are observers.
- Client disconnections must not pause or alter authorization progression.

Alternative considered:
- Only progress state when a client is connected to SSE.
Why not:
- Violates independent server processing and can miss completions when clients disconnect.

### 3) Standardize stream event contract in shared schemas
Decision:
- Add shared Zod schemas as discriminated unions for SSE events (e.g., `eventType`) in `shared/src/api/*`.
- Define strongly typed server serializers and client parsers from those schemas.
- Event set includes:
  - `connected`: subscription confirmation.
  - `pending`: non-terminal pending state.
  - flow-specific typed terminal events (`authorized`, `expired`, `not_found`, `account_exists`, `rejected`, `error`).
  - `error`: structured error payload.

Rationale:
- Shared Zod contracts maintain end-to-end typing across server and client without ad-hoc event parsing.

Alternative considered:
- Unstructured JSON events per route.
Why not:
- Increases drift risk and weakens compile-time guarantees.

### 4) Remove legacy polling endpoints and client polling logic
Decision:
- Remove polling endpoints and polling query logic from all flows.
- SSE is the only client transport for progress updates.

Rationale:
- This is a greenfield demo project with no legacy clients to preserve.

Alternative considered:
- Keep temporary compatibility.
Why not:
- Adds dead code and maintenance cost with no supported consumers.

### 5) Callback SSE stream identity uses `response_code` from query params
Decision:
- Client callback route opens SSE with `response_code` from URL query params.
- Server resolves `response_code` to authorization context and streams updates for that correlation.

Rationale:
- Matches current callback entrypoint shape and avoids additional client correlation lookup.

Alternative considered:
- Require client to first fetch authorization ID and then subscribe by authorization ID.
Why not:
- Adds extra round trips and coupling.

### 6) Apply the same SSE security/access model to all flows
Decision:
- Use authenticated/authorized SSE access consistently across all flows (signin, signup, profile update, loan, payment, callback) with flow-specific authorization checks.

Rationale:
- Prevents uneven security posture and simplifies implementation patterns.

Alternative considered:
- Different auth models per flow.
Why not:
- Increases complexity and risk of route-specific gaps.

### 7) Use composable SSE transport modules and a default 1s server monitor cadence
Decision:
- Build SSE implementation from small shared modules (typed envelope schema, serializer, channel router, connection writer, cleanup hooks) reused across route-level streams.
- Use a default server authorization monitor cadence of 1 second per active pending request for this demo.

Rationale:
- Composition keeps business-domain event producers independent from transport mechanics and simplifies adding new SSE features (such as debug streaming) without rewriting core logic.
- A 1 second cadence is responsive enough for demo UX while staying simple to reason about.

Alternative considered:
- Flow-specific cadence profiles from day one.
Why not:
- Premature complexity for the current scope; can be tuned later if load warrants.

## Risks / Trade-offs

- [SSE connection drops or intermediary buffering] -> Mitigation: heartbeat/keepalive events, client reconnect with backoff, and terminal-state fetch on reconnect.
- [Missed events during reconnect window] -> Mitigation: send current snapshot immediately on stream subscribe; stream consumers treat snapshot as source of truth.
- [Long-lived connection resource usage on server] -> Mitigation: request-scoped subscriptions, explicit cleanup on disconnect, timeout caps.
- [Server monitor and callback/DC API paths race to update state] -> Mitigation: single state-transition function with idempotent guards and terminal-state short-circuiting.
- [SSE contract drift between routes] -> Mitigation: shared discriminated union schemas + shared serializer/parser helpers; validate payloads before emit/consume.
- [1s monitor cadence may add unnecessary load under high concurrency] -> Mitigation: keep cadence configurable and add adaptive backoff only if metrics show pressure.

## Migration Plan

1. Introduce shared typed SSE schemas/types in `shared/src/api/` (authorization stream + callback stream), including discriminated unions.
2. Extract server-side state transition module for pending auth requests (single source for pending -> terminal updates and event emission).
3. Implement server authorization monitor (background process) that progresses pending requests independent of client subscriptions.
4. Add SSE route modules with small composable units:
   - stream context/auth guard
   - initial snapshot writer
   - typed event emitter adapter
   - disconnect cleanup
5. Migrate all client flows (`signin`, `signup`, `profile`, `loan`, `payment`, `callback`) to EventSource subscription hooks and remove polling queries.
6. Delete polling endpoints and obsolete polling-specific shared schemas/types.
7. Run type/lint checks and verify terminal behavior across all flows.

Rollback:
- Revert to previous commit; no in-app compatibility layer is kept in this change.

## Open Questions

- None currently.
