## 1. Shared SSE Contracts

- [x] 1.1 Add shared authorization SSE event schemas in `shared/src/api/` using discriminated unions (`connected`, `status_update`, `terminal`, `error`).
- [x] 1.2 Add shared callback SSE event schemas keyed to `response_code` correlation and export inferred TypeScript types.
- [x] 1.3 Remove or update polling-specific shared status schemas that are no longer used by client/server APIs.

## 2. Server State and Monitoring

- [x] 2.1 Extract a single pending-request state transition module that applies idempotent pending-to-terminal updates.
- [x] 2.2 Implement a server authorization monitor that starts on request creation and checks status on a 1 second cadence.
- [x] 2.3 Ensure monitor progression and callback/DC API completion both emit typed internal events through shared app event types.

## 3. Server SSE Transport Composition

- [x] 3.1 Create reusable SSE transport utilities (typed envelope serializer, event writer, keepalive, disconnect cleanup).
- [x] 3.2 Add request-scoped authorization SSE endpoint(s) that emit initial snapshot, incremental updates, and terminal events.
- [x] 3.3 Add callback SSE endpoint that accepts `response_code`, resolves correlation, and streams typed callback updates/errors.

## 4. Client SSE Infrastructure

- [x] 4.1 Add reusable EventSource client utilities/hooks for typed parsing, reconnect handling, and terminal stream closure.
- [x] 4.2 Add shared client mappers from typed SSE events to existing auth UI state machine transitions.
- [x] 4.3 Remove generic polling-query helpers from auth flow abstractions that are replaced by SSE subscriptions.

## 5. Flow Migration

- [x] 5.1 Migrate signin flow from polling status endpoint usage to authorization SSE stream updates.
- [x] 5.2 Migrate signup flow from polling status endpoint usage to authorization SSE stream updates.
- [x] 5.3 Migrate profile update flow from polling status endpoint usage to authorization SSE stream updates.
- [x] 5.4 Migrate loan flow from polling status endpoint usage to authorization SSE stream updates.
- [x] 5.5 Migrate payment flow from polling status endpoint usage to authorization SSE stream updates.
- [x] 5.6 Migrate callback route to initiate SSE with `response_code` from query params.

## 6. Remove Polling Endpoints and Dead Code

- [x] 6.1 Remove `/status/:requestId` polling endpoints and related handlers from signin/signup/profile/loan/payment server routes.
- [x] 6.2 Remove server-side code paths that couple status checks to client polling endpoints.
- [x] 6.3 Delete client polling timers/query intervals and UI branches that only support polling behavior.

## 7. Validation and Cleanup

- [ ] 7.1 Add/adjust tests for typed SSE event validation, server monitor progression, and terminal event delivery across all flows.
- [ ] 7.2 Add/adjust tests for callback SSE resolution path with valid and invalid `response_code` inputs.
- [x] 7.3 Run `bun run check-types` and `bun run lint` and resolve all issues introduced by the migration.
