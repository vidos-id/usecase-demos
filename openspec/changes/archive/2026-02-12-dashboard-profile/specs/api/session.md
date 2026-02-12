# session-endpoint

## ADDED Requirements

### Requirement: Session validation endpoint
The system SHALL provide a GET /api/session endpoint that returns the current session status.

#### Scenario: Authenticated session
- **WHEN** a request is made with a valid session token in the Authorization header
- **THEN** the system returns `{ authenticated: true, userId: "<user-id>", mode: "<mode>" }`

#### Scenario: Unauthenticated session
- **WHEN** a request is made without an Authorization header
- **THEN** the system returns `{ authenticated: false }`

#### Scenario: Invalid session token
- **WHEN** a request is made with an invalid or expired session token
- **THEN** the system returns `{ authenticated: false }`

### Requirement: Session mode reporting
The system SHALL include the presentation mode in the session response for authenticated users.

#### Scenario: Direct POST mode session
- **WHEN** a user authenticated via direct_post presentation checks their session
- **THEN** the response includes `mode: "direct_post"`

#### Scenario: DC API mode session
- **WHEN** a user authenticated via dc_api presentation checks their session
- **THEN** the response includes `mode: "dc_api"`

### Requirement: Session token authentication
The system SHALL extract the session token from the Authorization header using Bearer scheme.

#### Scenario: Bearer token format
- **WHEN** a request includes `Authorization: Bearer <session-id>`
- **THEN** the system extracts `<session-id>` for session lookup

#### Scenario: Missing Bearer prefix
- **WHEN** a request includes an Authorization header without "Bearer " prefix
- **THEN** the system treats the request as unauthenticated
