## ADDED Requirements

### Requirement: Admin reset endpoint
The system SHALL provide a DELETE /api/admin/reset endpoint that clears all in-memory user and session data.

#### Scenario: Successful reset
- **WHEN** DELETE /api/admin/reset is called
- **THEN** the system clears all users from the user store, clears all sessions from the session store, and returns 200 with a confirmation message

#### Scenario: Reset with active sessions
- **WHEN** DELETE /api/admin/reset is called while users have active sessions
- **THEN** the system clears all sessions regardless of active state

### Requirement: No authentication required
The reset endpoint SHALL be publicly accessible without authentication checks.

#### Scenario: Public access
- **WHEN** DELETE /api/admin/reset is called without any authorization
- **THEN** the system processes the reset normally

### Requirement: Response schema for reset
The system SHALL return a JSON response with success boolean and message string fields.

#### Scenario: Success response format
- **WHEN** reset completes successfully
- **THEN** the response body contains `{ "success": true, "message": "Demo data has been reset" }`

### Requirement: Store clearing through encapsulated methods
The system SHALL use dedicated clearAllUsers() and clearAllSessions() functions to clear in-memory stores.

#### Scenario: User store clearing
- **WHEN** reset is executed
- **THEN** the clearAllUsers() function is called to clear the users Map

#### Scenario: Session store clearing
- **WHEN** reset is executed
- **THEN** the clearAllSessions() function is called to clear the sessions Map
