# Delta for Server Data Models

## ADDED Requirements

### Requirement: User Store Operations
The system SHALL provide CRUD operations for user entities using an in-memory Map-based store.

#### Scenario: Create user
- **WHEN** a new user is created with identifier, family name, given name, birth date, and optional portrait
- **THEN** system assigns unique ID and timestamp, stores user, and returns user object

#### Scenario: Retrieve user by ID
- **WHEN** caller requests user by ID
- **THEN** system returns user if found, undefined otherwise

#### Scenario: Retrieve user by identifier
- **WHEN** caller requests user by PID identifier
- **THEN** system returns user if found, undefined otherwise

#### Scenario: List all users
- **WHEN** caller requests all users
- **THEN** system returns array of all stored users

### Requirement: Session Store Operations
The system SHALL provide session management with expiration tracking using an in-memory Map-based store.

#### Scenario: Create session
- **WHEN** a new session is created with user ID and expiration timestamp
- **THEN** system assigns unique session ID, stores session, and returns session object

#### Scenario: Retrieve session by ID
- **WHEN** caller requests session by ID
- **THEN** system returns session if found and not expired, undefined otherwise

#### Scenario: List sessions by user
- **WHEN** caller requests all sessions for a user ID
- **THEN** system returns array of non-expired sessions for that user

#### Scenario: Delete session
- **WHEN** caller deletes a session by ID
- **THEN** system removes session from store and returns true if existed

#### Scenario: Session expiration check
- **WHEN** retrieving a session
- **THEN** system MUST check if current time exceeds expiresAt and treat expired sessions as not found

### Requirement: Pending Authorization Request Store Operations
The system SHALL manage pending authorization requests with lifecycle states (pending, completed, failed, expired) using an in-memory Map-based store.

#### Scenario: Create pending request
- **WHEN** a new authorization request is created with auth ID, mode, and format
- **THEN** system stores request with status "pending", creation timestamp, and returns request object

#### Scenario: Retrieve pending request by auth ID
- **WHEN** caller requests pending request by Vidos authorization ID
- **THEN** system returns request if found, undefined otherwise

#### Scenario: Retrieve pending request by identifier
- **WHEN** caller requests pending request by unique identifier
- **THEN** system returns request if found, undefined otherwise

#### Scenario: Update request to completed
- **WHEN** authorization completes successfully with extracted claims
- **THEN** system updates status to "completed", stores claims, records completion timestamp

#### Scenario: Update request to failed
- **WHEN** authorization fails with error message
- **THEN** system updates status to "failed", stores error, records failure timestamp

#### Scenario: Update request to expired
- **WHEN** authorization request expires
- **THEN** system updates status to "expired", records expiration timestamp

#### Scenario: List pending requests
- **WHEN** caller requests all pending requests
- **THEN** system returns array of requests with status "pending"

### Requirement: User Data Model
The system SHALL define a User type with required and optional fields.

#### Scenario: User type structure
- **WHEN** user object is created
- **THEN** it MUST contain id (string), identifier (string), familyName (string), givenName (string), birthDate (string), createdAt (Date), and MAY contain portrait (string)

### Requirement: Session Data Model
The system SHALL define a Session type with required fields.

#### Scenario: Session type structure
- **WHEN** session object is created
- **THEN** it MUST contain id (string), userId (string), createdAt (Date), and expiresAt (Date)

### Requirement: Pending Authorization Request Data Model
The system SHALL define a PendingAuthRequest type with required fields and union status.

#### Scenario: Pending request type structure
- **WHEN** pending request object is created
- **THEN** it MUST contain id (string), authId (string), mode (string), format (string), status (union of "pending" | "completed" | "failed" | "expired"), createdAt (Date)

#### Scenario: Pending request with completed status
- **WHEN** request status is "completed"
- **THEN** it MUST contain claims object and completedAt timestamp

#### Scenario: Pending request with failed status
- **WHEN** request status is "failed"
- **THEN** it MUST contain error message and failedAt timestamp

#### Scenario: Pending request with expired status
- **WHEN** request status is "expired"
- **THEN** it MUST contain expiredAt timestamp
