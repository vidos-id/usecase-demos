# user-profile-endpoint

## ADDED Requirements

### Requirement: User profile retrieval
The system SHALL provide a GET /api/users/me endpoint that returns the authenticated user's profile data.

#### Scenario: Authenticated user requests profile
- **WHEN** an authenticated user requests GET /api/users/me
- **THEN** the system returns the user's profile including all PID-sourced fields

#### Scenario: Unauthenticated user requests profile
- **WHEN** an unauthenticated user requests GET /api/users/me
- **THEN** the system returns HTTP 401 Unauthorized

#### Scenario: Invalid session token
- **WHEN** a request includes an invalid session token
- **THEN** the system returns HTTP 401 Unauthorized

### Requirement: PID data inclusion
The system SHALL include all PID-sourced fields in the user profile response.

#### Scenario: Complete profile data
- **WHEN** a user's profile is retrieved
- **THEN** the response includes familyName, givenName, address, birthDate, and nationality

#### Scenario: Profile with portrait
- **WHEN** a user's profile includes a portrait image
- **THEN** the response includes the portrait as a base64-encoded string

#### Scenario: Profile without portrait
- **WHEN** a user's profile does not include a portrait image
- **THEN** the response omits the portrait field or sets it to null

### Requirement: Session-based authentication
The system SHALL authenticate requests using the session token from the Authorization header.

#### Scenario: Valid session with user
- **WHEN** a valid session token is provided for an existing user
- **THEN** the system retrieves and returns that user's profile

#### Scenario: Session with deleted user
- **WHEN** a valid session exists but the user was deleted
- **THEN** the system returns HTTP 401 Unauthorized
