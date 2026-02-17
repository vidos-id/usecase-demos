# SSE Debug Event Console

## ADDED Requirements

### Requirement: Debug Stream Endpoint
The system SHALL provide a dedicated SSE endpoint for debug events related to authorization and other request lifecycles.

#### Scenario: Subscribe to debug stream
- **WHEN** a client opens the debug SSE stream with a valid authenticated session
- **THEN** system establishes a debug event stream connection
- **THEN** system emits typed debug events for that subscriber scope

#### Scenario: Reject unauthenticated stream access
- **WHEN** a client attempts to open debug SSE stream without valid session context
- **THEN** system rejects the stream subscription
- **THEN** no debug events are delivered

### Requirement: Debug Console Panel in Client UI
The system SHALL expose a dedicated debug console panel that is toggleable from the client UI.

#### Scenario: Toggle open debug panel
- **WHEN** user activates the debug panel toggle in the UI
- **THEN** system opens the debug console panel
- **THEN** panel starts or resumes consuming debug SSE events

#### Scenario: Toggle close debug panel
- **WHEN** user deactivates the debug panel toggle
- **THEN** system hides the debug console panel
- **THEN** client stops or pauses debug stream updates according to panel lifecycle rules

### Requirement: Typed Debug Event Contract
The system SHALL define debug event payloads as shared typed schemas used by both server emitters and client consumers.

#### Scenario: Shared discriminated union validation
- **WHEN** server emits debug events
- **THEN** payloads conform to shared discriminated-union schema variants
- **THEN** client validates/parses the same event contracts successfully

#### Scenario: Invalid debug event payload
- **WHEN** a debug payload does not match the shared schema
- **THEN** system rejects the invalid payload path
- **THEN** client does not treat invalid payload as a valid debug event

### Requirement: Session and Request Scoped Isolation
The system SHALL scope debug event delivery to the active user session and request correlation so users only see logs relevant to their own requests.

#### Scenario: Deliver only relevant request events
- **WHEN** user has active debug stream and triggers request(s)
- **THEN** system emits debug events only for request IDs/correlations owned by that user session
- **THEN** debug panel shows only relevant events for that session

#### Scenario: Prevent cross-user log visibility
- **WHEN** multiple users have concurrent sessions and requests
- **THEN** each debug stream receives only events for its own session/request scope
- **THEN** system MUST NOT deliver events from other users to the subscriber

### Requirement: Controlled Verbosity for Debug Stream
The system SHALL provide verbose but bounded debug output suitable for diagnostics and demonstrations.

#### Scenario: Default level filtering
- **WHEN** debug panel starts in default mode
- **THEN** system/client show `info`, `warn`, and `error` events by default
- **THEN** user can opt in to `debug` level events

#### Scenario: Prevent unbounded event growth
- **WHEN** debug stream runs for extended periods
- **THEN** client stores events in a bounded in-memory buffer
- **THEN** oldest events are evicted once buffer limit is reached
