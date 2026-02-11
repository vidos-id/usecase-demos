# account-menu

## ADDED Requirements

### Requirement: Account menu component
The system SHALL provide an account menu component for authenticated user actions.

#### Scenario: Menu visibility in protected routes
- **WHEN** a user is on a protected route (dashboard or profile)
- **THEN** the account menu is displayed in the page header

#### Scenario: Menu not shown on public routes
- **WHEN** a user is on a public route (home, auth callback)
- **THEN** the account menu is not displayed

### Requirement: User identification in menu
The system SHALL display the user's name or avatar in the account menu trigger.

#### Scenario: User name display
- **WHEN** the account menu is rendered
- **THEN** the trigger shows the user's givenName and familyName or initials

#### Scenario: Avatar display
- **WHEN** the user has a portrait
- **THEN** the account menu trigger displays the portrait as an avatar

### Requirement: Sign Out option
The system SHALL provide a "Sign Out" option in the account menu.

#### Scenario: Sign Out option visibility
- **WHEN** the account menu is opened
- **THEN** the "Sign Out" option is displayed

#### Scenario: Sign Out action
- **WHEN** a user clicks "Sign Out"
- **THEN** the system clears the session and redirects to the home page (/)

### Requirement: Reset Demo Data option
The system SHALL provide a "Reset Demo Data" option in the account menu.

#### Scenario: Reset option visibility
- **WHEN** the account menu is opened
- **THEN** the "Reset Demo Data" option is displayed

#### Scenario: Reset action trigger
- **WHEN** a user clicks "Reset Demo Data"
- **THEN** the system calls the admin reset endpoint to clear all demo data

#### Scenario: Post-reset behavior
- **WHEN** demo data is reset successfully
- **THEN** the system clears the session and redirects to the home page (/)

### Requirement: Menu dropdown behavior
The system SHALL implement standard dropdown menu behavior for the account menu.

#### Scenario: Menu opens on click
- **WHEN** a user clicks the account menu trigger
- **THEN** the dropdown menu opens displaying all options

#### Scenario: Menu closes on option select
- **WHEN** a user selects a menu option
- **THEN** the dropdown menu closes

#### Scenario: Menu closes on outside click
- **WHEN** the menu is open and the user clicks outside
- **THEN** the dropdown menu closes
