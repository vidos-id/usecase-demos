# Delta for Profile Update

## REMOVED Requirements

### Requirement: Profile Update Status Polling
**Reason**: Status polling is replaced by SSE updates and server-managed authorization monitoring.
**Migration**: Subscribe to profile update SSE stream by `requestId` and handle `connected`, `pending`, and typed terminal status events.

## ADDED Requirements

### Requirement: Profile Update Status Streaming
The system SHALL stream profile update authorization status over SSE while authorization monitoring and completion continue independently on the server.

#### Scenario: Subscribe to pending profile update status
- **WHEN** client creates profile update request and opens SSE stream with `requestId`
- **THEN** system sends `connected` event with current persisted request snapshot
- **THEN** system keeps stream open for subsequent status events

#### Scenario: Stream terminal completion result
- **WHEN** server monitoring or callback/DC API processing transitions request to terminal state
- **THEN** system emits the typed terminal status event (`authorized`, `rejected`, `error`, or `expired`)
- **THEN** for `authorized` status system updates user fields from extracted claims and marks the request as completed

#### Scenario: Resume after client reconnect
- **WHEN** client reconnects to the profile update SSE stream after disconnect
- **THEN** system emits latest persisted snapshot in `connected` event
- **THEN** client derives current UI state from stream payloads without polling backfill
