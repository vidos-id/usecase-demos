## ADDED Requirements

### Requirement: Reset demo data option in account menu
The system SHALL display a "Reset Demo Data" option in the authenticated user's account menu.

#### Scenario: Account menu contains reset option
- **WHEN** an authenticated user opens the account menu
- **THEN** the menu displays a "Reset Demo Data" option

### Requirement: Reset option opens confirmation dialog
The system SHALL display a confirmation dialog when the user clicks "Reset Demo Data".

#### Scenario: Confirmation dialog appears
- **WHEN** the user clicks "Reset Demo Data" in the account menu
- **THEN** the reset confirmation dialog opens with warning text

### Requirement: Confirmed reset calls API endpoint
The system SHALL call DELETE /api/admin/reset when the user confirms the reset action.

#### Scenario: API call on confirmation
- **WHEN** the user confirms the reset in the confirmation dialog
- **THEN** the client sends DELETE /api/admin/reset

### Requirement: Toast notification on reset success
The system SHALL display a toast notification after successful reset.

#### Scenario: Success toast message
- **WHEN** DELETE /api/admin/reset returns successfully
- **THEN** the client displays a toast message "Demo data has been reset"

### Requirement: Session cleanup after reset
The system SHALL clear sessionStorage after successful reset.

#### Scenario: Session storage cleared after reset
- **WHEN** DELETE /api/admin/reset completes successfully
- **THEN** the client removes "sessionId" from sessionStorage

### Requirement: Redirect to landing page after reset
The system SHALL navigate the user to the landing page (/) after successful reset.

#### Scenario: Post-reset navigation
- **WHEN** DELETE /api/admin/reset completes successfully, toast is shown, and storage is cleared
- **THEN** the client navigates to "/" using TanStack Router

#### Scenario: Landing page after reset shows clean state
- **WHEN** the user arrives at "/" after reset
- **THEN** the landing page displays the unauthenticated UI with no residual session data
