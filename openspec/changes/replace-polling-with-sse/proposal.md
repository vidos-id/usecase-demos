## Why

Client flows currently rely on repeated polling calls to detect authorization completion and callback resolution, which increases request load and adds visible latency in UX updates. Replacing polling with server-sent events (SSE) gives push-based status updates and aligns better with event-driven state transitions already present on the server.

## What Changes

- Add SSE endpoints for real-time authorization status updates across auth flows (signin, signup, profile update, loan, payment) so clients subscribe instead of polling.
- Add SSE support for callback resolution updates so callback state changes are pushed to clients without periodic resolve retries.
- Update client flow logic from interval/query polling to EventSource-based subscriptions with fallback/error handling for disconnects and timeouts.
- Update shared API schemas/types to represent SSE event payloads and terminal-state signaling with discriminated unions.
- Define reusable SSE transport composition (shared envelope, serializer, stream writer, channel routing) so future SSE features can reuse infrastructure without coupling to auth payloads.
- Remove polling endpoints and polling client logic after migration because this project has no legacy polling clients.

## Capabilities

### New Capabilities

- `authorization-and-callback-sse`: Stream authorization and callback state transitions from server to client via SSE, including terminal outcomes and error propagation.
  - This capability includes reusable SSE transport primitives intended to support additional SSE channels (for example, debug streams) while keeping domain payloads isolated.

### Modified Capabilities

- `profile-update`: Replace profile update status polling requirements with SSE subscription requirements for pending/terminal authorization updates.

## Impact

- Affected client routes/components:
  - `client/src/components/auth/auth-flow.tsx`
  - `client/src/routes/_auth/profile.tsx`
  - `client/src/routes/_auth/loan/index.tsx`
  - `client/src/routes/_auth/send/confirm.tsx`
  - `client/src/routes/callback.tsx`
- Affected server routes/services/stores:
  - `server/src/routes/signin.ts`
  - `server/src/routes/signup.ts`
  - `server/src/routes/profile-update.ts`
  - `server/src/routes/payment.ts`
  - `server/src/routes/callback.ts`
  - `server/src/lib/events.ts`
  - `server/src/stores/pending-auth-requests.ts`
- Affected shared contracts:
  - `shared/src/api/*` for event schema additions/changes related to status and callback updates.
- External dependencies:
  - Uses browser-native `EventSource`; no new third-party runtime dependency required.
