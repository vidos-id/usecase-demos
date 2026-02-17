# Authorization and Callback SSE

## ADDED Requirements

### Requirement: Server-Managed Authorization Monitoring
The system SHALL monitor pending authorization requests on the server independent of client SSE subscriptions.

#### Scenario: Monitoring starts when request is created
- **WHEN** a new authorization request is stored as pending
- **THEN** system starts server-managed monitoring for that request lifecycle
- **THEN** monitoring does not depend on any active client subscription

#### Scenario: Monitoring polls Vidos status every second
- **WHEN** a request is in pending state and requires status checks
- **THEN** system checks Vidos authorization status at a default cadence of 1 second
- **THEN** system continues until request reaches a terminal state

#### Scenario: Monitoring updates state without subscribers
- **WHEN** no clients are connected to SSE for a pending request
- **THEN** system still transitions request state based on monitor or callback/DC API completion
- **THEN** system persists final state and emits internal resolution events

### Requirement: Authorization Status SSE Stream
The system SHALL provide request-scoped SSE status streams for signin, signup, profile update, loan, and payment authorization flows.

#### Scenario: Stream sends connected snapshot
- **WHEN** client subscribes to authorization stream with a valid `requestId`
- **THEN** system sends a `connected` event containing the current persisted status snapshot

#### Scenario: Stream sends status update events
- **WHEN** request transitions through non-terminal state updates
- **THEN** system sends `status_update` events for that `requestId`

#### Scenario: Stream sends terminal event and closes
- **WHEN** request reaches terminal state (`authorized`, `rejected`, `error`, or `expired`)
- **THEN** system sends a `terminal` event with final status payload
- **THEN** system closes or finalizes stream lifecycle for that request

### Requirement: Callback Resolution SSE by Response Code
The system SHALL provide callback SSE updates initiated by `response_code` from callback query parameters.

#### Scenario: Callback stream resolves response code
- **WHEN** client opens callback SSE stream with `response_code`
- **THEN** system resolves the response code to authorization context
- **THEN** system streams callback lifecycle updates for that correlation

#### Scenario: Invalid response code emits stream error
- **WHEN** provided `response_code` is invalid or expired
- **THEN** system sends typed `error` event describing the failure
- **THEN** system terminates the callback stream

### Requirement: Typed SSE Event Contracts
The system SHALL define and enforce typed SSE event payloads shared across server and client.

#### Scenario: Shared discriminated union contract
- **WHEN** SSE event schemas are defined in shared API contracts
- **THEN** schemas use discriminated union typing for supported event variants (`connected`, `status_update`, `terminal`, `error`)
- **THEN** server and client use those same schemas for runtime validation and static typing

#### Scenario: Invalid payload is rejected
- **WHEN** an SSE payload does not satisfy the shared schema
- **THEN** system rejects emitting or consuming the invalid payload
- **THEN** system records a typed error path instead of silently accepting malformed events

### Requirement: Polling Status Endpoints Are Removed
The system SHALL remove polling status endpoints and polling-based client update loops for migrated authorization and callback flows.

#### Scenario: Client flows use SSE only
- **WHEN** signin, signup, profile update, loan, payment, and callback flows run
- **THEN** clients subscribe to SSE updates and do not run status polling intervals

#### Scenario: Deprecated status polling endpoints are unavailable
- **WHEN** a caller attempts to use removed polling status endpoints
- **THEN** system does not provide polling status behavior for these flows
