# Delta for Data Models

## MODIFIED Requirements

### Requirement: User Store Operations
The system SHALL provide CRUD operations for user entities using SQLite database via Drizzle ORM.

#### Scenario: Create user
- **WHEN** a new user is created with identifier, family name, given name, birth date, nationality, and optional fields
- **THEN** system generates unique ID and timestamp
- **THEN** system inserts user into `users` table with seeded activity data
- **THEN** system returns user object

#### Scenario: Retrieve user by ID
- **WHEN** caller requests user by ID
- **THEN** system queries `users` table by primary key
- **THEN** system returns user if found, undefined otherwise

#### Scenario: Retrieve user by identifier
- **WHEN** caller requests user by PID identifier
- **THEN** system queries `users` table by `identifier` column
- **THEN** system returns user if found, undefined otherwise

#### Scenario: Update user
- **WHEN** caller updates user with partial data
- **THEN** system updates matching row in `users` table
- **THEN** system returns updated user object

#### Scenario: Clear all users
- **WHEN** admin reset is triggered
- **THEN** system deletes all rows from `users` table
- **THEN** cascading delete removes related sessions

### Requirement: Session Store Operations
The system SHALL provide session management with expiration tracking using SQLite database.

#### Scenario: Create session
- **WHEN** a new session is created with user ID, mode, and TTL
- **THEN** system generates unique session ID
- **THEN** system calculates expiration timestamp from TTL
- **THEN** system inserts session into `sessions` table
- **THEN** system returns session object

#### Scenario: Retrieve session by ID
- **WHEN** caller requests session by ID
- **THEN** system queries `sessions` table by primary key
- **THEN** system checks if current time is before `expires_at`
- **THEN** system returns session if found and not expired, undefined otherwise

#### Scenario: Delete session
- **WHEN** caller deletes a session by ID
- **THEN** system deletes row from `sessions` table
- **THEN** system returns true if row existed

#### Scenario: Clear all sessions
- **WHEN** admin reset is triggered
- **THEN** system deletes all rows from `sessions` table

### Requirement: Pending Authorization Request Store Operations
The system SHALL manage pending authorization requests using SQLite database.

#### Scenario: Create pending request
- **WHEN** a new authorization request is created with auth ID, type, mode, and optional metadata
- **THEN** system generates unique request ID
- **THEN** system inserts request with status "pending" into `pending_auth_requests` table
- **THEN** system returns request object

#### Scenario: Retrieve pending request by auth ID
- **WHEN** caller requests pending request by Vidos authorization ID
- **THEN** system queries `pending_auth_requests` table by `vidos_authorization_id`
- **THEN** system checks expiration based on request type (5min for loan/payment, 10min for signup/signin)
- **THEN** system returns request if found and not expired, undefined otherwise

#### Scenario: Retrieve pending request by ID
- **WHEN** caller requests pending request by internal ID
- **THEN** system queries `pending_auth_requests` table by primary key
- **THEN** system returns request if found, undefined otherwise

#### Scenario: Update request to completed
- **WHEN** authorization completes successfully with claims
- **THEN** system updates row: status="completed", completed_at=now, result=JSON with claims

#### Scenario: Update request to failed
- **WHEN** authorization fails with error
- **THEN** system updates row: status="failed", completed_at=now, result=JSON with error

#### Scenario: Clear all pending requests
- **WHEN** admin reset is triggered
- **THEN** system deletes all rows from `pending_auth_requests` table

### Requirement: Activity Item Storage
The system SHALL store user activity items as JSON array in the users table.

#### Scenario: Add activity item
- **WHEN** a payment or loan activity is recorded
- **THEN** system prepends new activity item to user's `activity` JSON array
- **THEN** system updates user's `balance` accordingly

#### Scenario: Retrieve activity
- **WHEN** user profile is requested
- **THEN** system parses `activity` JSON column
- **THEN** system returns activity items sorted by createdAt descending
