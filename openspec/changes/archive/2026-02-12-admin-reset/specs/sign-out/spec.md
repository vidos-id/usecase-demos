## ADDED Requirements

### Requirement: Sign-out option in account menu
The system SHALL display a "Sign Out" option in the authenticated user's account menu.

#### Scenario: Account menu contains sign-out
- **WHEN** an authenticated user opens the account menu
- **THEN** the menu displays a "Sign Out" option

#### Scenario: Sign-out option visibility
- **WHEN** a user is not authenticated
- **THEN** the account menu is not displayed

### Requirement: Sign-out triggers session destruction
The system SHALL call DELETE /api/session when the user clicks "Sign Out".

#### Scenario: API call on sign-out
- **WHEN** the user clicks "Sign Out" in the account menu
- **THEN** the client sends DELETE /api/session with the current session ID in the Authorization header

### Requirement: Client-side session cleanup after sign-out
The system SHALL clear localStorage of session-related data after successful sign-out.

#### Scenario: Local storage cleared
- **WHEN** DELETE /api/session returns successfully
- **THEN** the client removes "sessionId" from localStorage

#### Scenario: Auth mode storage cleared
- **WHEN** DELETE /api/session returns successfully
- **THEN** the client removes "authMode" from localStorage

### Requirement: Redirect to landing page after sign-out
The system SHALL navigate the user to the landing page (/) after successful sign-out.

#### Scenario: Post-sign-out navigation
- **WHEN** DELETE /api/session completes successfully and storage is cleared
- **THEN** the client navigates to "/" using TanStack Router

#### Scenario: Landing page shows unauthenticated state
- **WHEN** the user arrives at "/" after sign-out
- **THEN** the landing page displays the unauthenticated UI state
