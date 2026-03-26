## Purpose

Web application hosted at `/ticket-agent/` with user signup/signin, PID identity verification, agent onboarding, event browsing, and ticket booking. UI SHALL be built using the frontend-design skill for high design quality.

## ADDED Requirements

### Requirement: User signup and signin

The web app SHALL provide username/password signup and signin forms following the demo-bank pattern. Signup SHALL create a new user account persisted in the server's SQLite database. Signin SHALL authenticate against existing accounts. Both SHALL return a session token used for subsequent authenticated requests. The app SHALL maintain the user session across page navigation.

#### Scenario: New user signs up
- **WHEN** a user submits a valid username and password on the signup form
- **THEN** the server SHALL create an account and return a session, and the app SHALL navigate to the authenticated home view

#### Scenario: Existing user signs in
- **WHEN** a user submits valid credentials on the signin form
- **THEN** the server SHALL authenticate them and return a session

#### Scenario: Unauthenticated user cannot access protected pages
- **WHEN** a user without a session attempts to access identity verification, agent onboarding, or booking pages
- **THEN** the app SHALL redirect them to the signin page

### Requirement: PID identity verification

After signing in, the user SHALL be able to verify their identity by presenting their PID via the Vidos Authorizer. The app SHALL create an authorization request through the server API, display a QR code encoding the `openid4vp://` authorization URL, and poll for verification status. Upon successful verification, the user's identity claims (`given_name`, `family_name`, `birth_date`) SHALL be stored against their account. Identity verification is a prerequisite for agent onboarding and for using the application to make event bookings.

#### Scenario: QR code displayed for wallet scanning
- **WHEN** the identity verification step is active
- **THEN** the app SHALL display a QR code encoding the authorization URL for wallet scanning

#### Scenario: Verification status polling
- **WHEN** the authorization is in a pending state
- **THEN** the app SHALL poll the server's status endpoint at regular intervals (2 seconds or less)

#### Scenario: Successful PID verification unlocks features
- **WHEN** the Vidos Authorizer returns an authorized status
- **THEN** the user's identity SHALL be stored and the agent onboarding and booking features SHALL become available

#### Scenario: Verification failure shows error with retry
- **WHEN** the verification is rejected, expired, or errors
- **THEN** the app SHALL display the error state and offer a retry option

### Requirement: Agent onboarding flow

Once identity is verified, the user SHALL be able to onboard their AI agent. The onboarding flow SHALL include: (1) a text input for the agent's wallet public key in JWK JSON format, (2) scope selection checkboxes, and (3) credential issuance and display. The onboarding SHALL NOT be accessible before identity verification is complete.

#### Scenario: Agent onboarding available after identity verification
- **WHEN** the user has completed PID verification
- **THEN** the agent onboarding section SHALL be accessible

#### Scenario: Agent onboarding blocked before identity verification
- **WHEN** the user has NOT completed PID verification
- **THEN** the agent onboarding section SHALL show a message indicating identity verification is required first

### Requirement: Agent public key input

The agent onboarding flow SHALL provide a text input for the user to paste the agent's wallet public key in JWK JSON format. The input SHALL validate that the pasted value is well-formed JSON and conforms to a JWK structure (has at minimum `kty` and key-type-specific fields). The input SHALL provide clear instructions explaining that the agent provides this key via `wallet-cli init`.

#### Scenario: Valid JWK accepted
- **WHEN** the user pastes a valid JWK JSON object
- **THEN** the app SHALL accept it and enable the next action

#### Scenario: Invalid JSON rejected
- **WHEN** the user pastes text that is not valid JSON
- **THEN** the app SHALL display a validation error

#### Scenario: Non-JWK JSON rejected
- **WHEN** the user pastes valid JSON that does not conform to JWK structure
- **THEN** the app SHALL display a validation error indicating the expected format

### Requirement: Delegation scope selection

The agent onboarding flow SHALL provide checkboxes for selecting delegation scopes. Available scopes SHALL be: `browse_events` (browse event catalog), `purchase_tickets` (purchase tickets on behalf of the user), and `manage_bookings` (view and cancel bookings). At least one scope SHALL be selected to proceed. The UI SHALL explain what each scope permits.

#### Scenario: User selects scopes
- **WHEN** the user checks one or more scope checkboxes
- **THEN** the selected scopes SHALL be included in the delegation credential

#### Scenario: No scopes selected prevents submission
- **WHEN** no scope checkboxes are checked
- **THEN** the submit button SHALL be disabled

### Requirement: Credential display and handoff

After successful credential issuance, the app SHALL display the compact `dc+sd-jwt` credential string in a copyable format. The display SHALL include: a copy-to-clipboard button, a summary of the credential contents (delegator name, scopes, expiry), and instructions explaining how to paste the credential into the agent's chat session for import via `wallet-cli import`.

#### Scenario: Credential displayed with copy button
- **WHEN** the credential is issued
- **THEN** the app SHALL display the full compact `dc+sd-jwt` string with a one-click copy button

#### Scenario: Credential summary shown
- **WHEN** the credential is displayed
- **THEN** the app SHALL show the delegator name, selected scopes, and expiry date in human-readable format

### Requirement: Event catalog browsing

The web app SHALL display the event catalog with filtering by category and city. Each event listing SHALL show the event name, category, city, venue, date, price, available tickets, and a cover image (generated from the event's `imagePrompt`). The catalog SHALL be browsable by any authenticated user.

#### Scenario: All events displayed
- **WHEN** the user navigates to the events section
- **THEN** all 20 events from the catalog SHALL be displayed

#### Scenario: Events filterable by category
- **WHEN** the user selects a category filter
- **THEN** only events matching that category SHALL be displayed

### Requirement: Ticket booking via web app

The web app SHALL support booking tickets for events. The booking flow SHALL create a booking via the server API, which triggers delegation credential verification via Vidos Authorizer. The app SHALL display a QR code for the `openid4vp://` authorization URL, poll for verification status, and show the booking confirmation upon success. This allows demonstrating the same verification flow that the agent performs, but driven by the user in the browser.

#### Scenario: Booking triggers verification
- **WHEN** the user initiates a ticket booking
- **THEN** the app SHALL create a booking and display a QR code for delegation credential verification

#### Scenario: Successful booking confirmation
- **WHEN** delegation credential verification succeeds
- **THEN** the app SHALL display the booking confirmation with event details, quantity, and delegator name from the verified credential

### Requirement: Frontend hosted at /ticket-agent/ subpath

The web app SHALL be configured to serve at the `/ticket-agent/` base path. All routes, assets, and API calls SHALL be relative to this subpath. The Vite build configuration SHALL set the base to `/ticket-agent/`.

#### Scenario: App accessible at subpath
- **WHEN** a user navigates to `/ticket-agent/`
- **THEN** the app SHALL load and render correctly

#### Scenario: Routes work under subpath
- **WHEN** the user navigates to `/ticket-agent/events` or any other app route
- **THEN** the TanStack Router SHALL resolve the route correctly under the subpath
