# dashboard-page

## ADDED Requirements

### Requirement: Protected dashboard route
The system SHALL provide a /dashboard route accessible only to authenticated users.

#### Scenario: Authenticated user visits dashboard
- **WHEN** an authenticated user navigates to /dashboard
- **THEN** the system displays the dashboard page

#### Scenario: Unauthenticated user visits dashboard
- **WHEN** an unauthenticated user navigates to /dashboard
- **THEN** the system redirects to the home page (/)

### Requirement: Welcome message display
The system SHALL display a personalized welcome message on the dashboard.

#### Scenario: Dashboard loads for user
- **WHEN** the dashboard page loads
- **THEN** the system displays "Welcome, [givenName] [familyName]"

### Requirement: Account balance display
The system SHALL display the user's account balance prominently on the dashboard.

#### Scenario: Balance display format
- **WHEN** the dashboard page loads
- **THEN** the system displays "EUR 12,450.00" as the account balance

#### Scenario: Currency formatting
- **WHEN** the balance is displayed
- **THEN** the system uses proper currency formatting with EUR prefix and two decimal places

### Requirement: Recent transactions list
The system SHALL display a list of 2-3 recent transactions on the dashboard.

#### Scenario: Transactions display
- **WHEN** the dashboard page loads
- **THEN** the system displays 2-3 fake transactions with date, merchant, and amount

#### Scenario: Transaction amount formatting
- **WHEN** transactions are displayed
- **THEN** negative amounts (debits) are shown with minus sign and positive amounts (credits) without sign

#### Scenario: Transaction date display
- **WHEN** transactions are displayed
- **THEN** each transaction shows the date in YYYY-MM-DD format or formatted locale date

### Requirement: Quick action buttons
The system SHALL provide quick action buttons for common tasks.

#### Scenario: Action buttons available
- **WHEN** the dashboard page loads
- **THEN** the system displays "Send Money", "Apply for Loan", and "View Profile" buttons

#### Scenario: View Profile navigation
- **WHEN** a user clicks "View Profile" button
- **THEN** the system navigates to the /profile page

#### Scenario: Send Money button
- **WHEN** the "Send Money" button is displayed
- **THEN** the button is present (action to be implemented in payment-flow change)

#### Scenario: Apply for Loan button
- **WHEN** the "Apply for Loan" button is displayed
- **THEN** the button is present (action to be implemented in loan-flow change)

### Requirement: Session validation on load
The system SHALL validate the user's session before rendering the dashboard.

#### Scenario: Valid session check
- **WHEN** the dashboard route loads
- **THEN** the system calls GET /api/session to verify authentication status

#### Scenario: Session expired during visit
- **WHEN** the session becomes invalid while viewing the dashboard
- **THEN** subsequent API calls fail with 401 and user is redirected to home
