## ADDED Requirements

### Requirement: Session destruction endpoint
The system SHALL provide a DELETE /api/session endpoint that destroys the current user's session identified by the Authorization header.

#### Scenario: Successful sign-out with valid session
- **WHEN** an authenticated user sends DELETE /api/session with a valid session ID in the Authorization header
- **THEN** the system destroys the session and returns 200 with success confirmation

#### Scenario: Sign-out without Authorization header
- **WHEN** DELETE /api/session is called without an Authorization header
- **THEN** the system returns 401 Unauthorized

#### Scenario: Sign-out with invalid session ID
- **WHEN** DELETE /api/session is called with an invalid or expired session ID
- **THEN** the system returns 200 (idempotent DELETE behavior)

### Requirement: Session identification from Authorization header
The system SHALL extract the session ID from the Authorization header using Bearer token format.

#### Scenario: Bearer token parsing
- **WHEN** the Authorization header contains "Bearer <sessionId>"
- **THEN** the system extracts the session ID by removing the "Bearer " prefix

#### Scenario: Missing Bearer prefix
- **WHEN** the Authorization header does not contain "Bearer " prefix
- **THEN** the system treats the request as unauthorized

### Requirement: Response schema for sign-out
The system SHALL return a JSON response with a success boolean field.

#### Scenario: Success response format
- **WHEN** sign-out completes successfully
- **THEN** the response body contains `{ "success": true }`

#### Scenario: Error response format
- **WHEN** sign-out fails due to missing authorization
- **THEN** the response body contains `{ "error": "Unauthorized" }` with status 401
