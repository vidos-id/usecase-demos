## Why

Client flows currently rely on repeated polling calls to detect authorization completion and callback resolution, which increases request load and adds visible latency in UX updates. Replacing polling with server-sent events (SSE) gives push-based status updates and aligns better with event-driven state transitions already present on the server.

## What Changes

- Add SSE endpoints for real-time authorization status updates across auth flows (signin, signup, profile update, loan, payment) so clients subscribe instead of polling.
- Add SSE support for callback resolution updates so callback state changes are pushed to clients without periodic resolve retries.
- Replace snapshot-style SSE payloads with minimal state-transition events (`connected`, `pending`, terminal state events, `error`) so client flows react to explicit state changes.
- Update shared API schemas/types to model transition-oriented discriminated unions for authorization and callback streams.
- Simplify client stream state handling by removing timer-driven SSE state orchestration and route-level template logic that duplicated transition handling.
- Keep reusable SSE transport composition (serializer, writer, keepalive, typed parser) while simplifying route event semantics.
- Remove polling endpoints and polling client logic after migration because this project has no legacy polling clients.

## Capabilities

### New Capabilities

- `authorization-and-callback-sse`: Stream authorization and callback state transitions from server to client via SSE with compact typed events and explicit terminal outcomes.
  - This capability includes reusable SSE transport primitives intended to support additional SSE channels (for example, debug streams) while keeping domain payloads isolated.

### Modified Capabilities

- `profile-update`: Replace profile update status polling requirements with SSE subscription requirements for pending/terminal authorization updates.

## Impact

- Affected client routes/components:
  - `client/src/components/auth/auth-flow.tsx`
  - `client/src/components/auth/polling-status.tsx`
  - `client/src/lib/sse.ts`
  - `client/src/lib/use-authorization-stream.ts`
  - `client/src/lib/use-callback-stream.ts`
  - `client/src/routes/_auth/profile.tsx`
  - `client/src/routes/_auth/loan/index.tsx`
  - `client/src/routes/_auth/send/confirm.tsx`
  - `client/src/routes/callback.tsx`
  - `client/src/routes/signin.tsx`
  - `client/src/routes/signup.tsx`
- Affected server routes/services/stores:
  - `server/src/routes/signin.ts`
  - `server/src/routes/signup.ts`
  - `server/src/routes/profile-update.ts`
  - `server/src/routes/payment.ts`
  - `server/src/routes/callback.ts`
  - `server/src/services/authorization-stream.ts`
  - `server/src/services/pending-request-transition.ts`
  - `server/src/lib/events.ts`
  - `server/src/stores/pending-auth-requests.ts`
- Affected shared contracts:
  - `shared/src/api/authorization-sse.ts`
  - `shared/src/api/callback-sse.ts`
- External dependencies:
  - Uses browser-native `EventSource`; no new third-party runtime dependency required.
