# profile-page

## ADDED Requirements

### Requirement: Protected profile route
The system SHALL provide a /profile route accessible only to authenticated users.

#### Scenario: Authenticated user visits profile
- **WHEN** an authenticated user navigates to /profile
- **THEN** the system displays the profile page

#### Scenario: Unauthenticated user visits profile
- **WHEN** an unauthenticated user navigates to /profile
- **THEN** the system redirects to the home page (/)

### Requirement: User name display
The system SHALL display the user's full name on the profile page.

#### Scenario: Name display
- **WHEN** the profile page loads
- **THEN** the system displays the user's givenName and familyName

### Requirement: Portrait display
The system SHALL display the user's portrait if available.

#### Scenario: Portrait available
- **WHEN** the profile page loads and the user has a portrait
- **THEN** the system displays the portrait image using data URI format `data:image/jpeg;base64,{portrait}`

#### Scenario: Portrait not available
- **WHEN** the profile page loads and the user has no portrait
- **THEN** the system displays a fallback (e.g., initials or placeholder avatar)

#### Scenario: Portrait initials fallback
- **WHEN** no portrait is available
- **THEN** the system displays the first letter of givenName and familyName as initials

### Requirement: Address display
The system SHALL display the user's address on the profile page.

#### Scenario: Address display
- **WHEN** the profile page loads
- **THEN** the system displays the user's address from PID data

### Requirement: Birth date display
The system SHALL display the user's birth date on the profile page.

#### Scenario: Birth date display
- **WHEN** the profile page loads
- **THEN** the system displays the user's birthDate from PID data

### Requirement: Nationality display
The system SHALL display the user's nationality on the profile page.

#### Scenario: Nationality display
- **WHEN** the profile page loads
- **THEN** the system displays the user's nationality from PID data

### Requirement: Welcome message for new users
The system SHALL display a welcome message for newly registered users.

#### Scenario: New user welcome
- **WHEN** a user views their profile for the first time after signup
- **THEN** the system displays "Welcome to DemoBank"

### Requirement: Profile data retrieval
The system SHALL fetch the user's profile data from the API.

#### Scenario: Profile data fetch
- **WHEN** the profile page loads
- **THEN** the system calls GET /api/users/me to retrieve profile data

#### Scenario: Profile fetch failure
- **WHEN** GET /api/users/me returns 401 Unauthorized
- **THEN** the system redirects to the home page (/)
