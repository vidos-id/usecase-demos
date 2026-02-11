# Verification UI Specifications

## ADDED Requirements

### Requirement: Display QR code for direct_post mode on desktop
The system SHALL render QR code containing authorization URL for direct_post verification.

#### Scenario: QR code displayed with authorization URL
- **WHEN** authorization request completes with direct_post mode and authorizeUrl
- **THEN** system renders QR code encoding authorizeUrl
- **THEN** QR code size is 256x256 pixels
- **THEN** QR code error correction level is M (medium)

#### Scenario: Responsive QR code sizing
- **WHEN** QR code is displayed on various screen sizes
- **THEN** QR code maintains aspect ratio
- **THEN** QR code does not exceed container max-width

### Requirement: Display wallet deep link button for direct_post mode on mobile
The system SHALL provide "Open Wallet" button for mobile deep link navigation.

#### Scenario: Deep link button displayed
- **WHEN** authorization request completes with direct_post mode and authorizeUrl
- **THEN** system displays "Open Wallet" button
- **THEN** button opens authorizeUrl in new window/tab when clicked

#### Scenario: Deep link navigation
- **WHEN** user clicks "Open Wallet" button
- **THEN** system opens authorizeUrl using window.open or location.href
- **THEN** wallet app intercepts deep link on mobile device

### Requirement: Trigger Digital Credentials API for dc_api mode
The system SHALL invoke navigator.credentials.get() when using dc_api presentation mode.

#### Scenario: DC API invocation on authorization request completion
- **WHEN** authorization request completes with dc_api mode and dcApiRequest
- **THEN** system calls navigator.credentials.get() with dcApiRequest as parameters
- **THEN** system waits for promise to resolve with DigitalCredential

#### Scenario: DC API user approval
- **WHEN** navigator.credentials.get() promise resolves with credential
- **THEN** system extracts credential data
- **THEN** system calls POST /api/{flow}/complete/:requestId with credential data

#### Scenario: DC API user rejection
- **WHEN** navigator.credentials.get() promise rejects with AbortError
- **THEN** system displays error message "Credential request was cancelled"
- **THEN** system allows user to retry

#### Scenario: DC API not supported during invocation
- **WHEN** navigator.credentials.get() is called but API is unavailable
- **THEN** system catches error
- **THEN** system displays error message "Browser wallet not supported"

### Requirement: Poll verification status for direct_post mode
The system SHALL poll status endpoint with exponential backoff until completion or timeout.

#### Scenario: Initial status poll
- **WHEN** authorization request completes with direct_post mode
- **THEN** system starts polling GET /api/{flow}/status/:requestId
- **THEN** initial poll interval is 1000ms

#### Scenario: Pending status response
- **WHEN** status endpoint returns `{ status: "pending" }`
- **THEN** system waits for current interval duration
- **THEN** system increases interval by 1.5x (max 5000ms)
- **THEN** system polls again

#### Scenario: Authorized status response
- **WHEN** status endpoint returns `{ status: "authorized", sessionId, user, mode }`
- **THEN** system stops polling
- **THEN** system stores sessionId and mode
- **THEN** system redirects to profile page (signup) or dashboard (signin)

#### Scenario: Rejected status response
- **WHEN** status endpoint returns `{ status: "rejected" }`
- **THEN** system stops polling
- **THEN** system displays error message "Authorization was rejected. Please try again."

#### Scenario: Expired status response
- **WHEN** status endpoint returns `{ status: "expired" }`
- **THEN** system stops polling
- **THEN** system displays error message "Authorization expired. Please try again."

#### Scenario: Error status response
- **WHEN** status endpoint returns `{ status: "error" }`
- **THEN** system stops polling
- **THEN** system displays error message "An error occurred. Please try again."

#### Scenario: Polling timeout
- **WHEN** polling duration exceeds 5 minutes (300000ms)
- **THEN** system stops polling
- **THEN** system displays error message "Request timed out. Please try again."

#### Scenario: Component unmount during polling
- **WHEN** user navigates away during active polling
- **THEN** useEffect cleanup cancels polling timers
- **THEN** no further status requests are sent

### Requirement: Display loading state during verification
The system SHALL show loading indicators during verification phases.

#### Scenario: Loading during authorization request creation
- **WHEN** user submits signup/signin and request is in flight
- **THEN** system displays loading spinner
- **THEN** submit button is disabled

#### Scenario: Loading during QR code verification wait
- **WHEN** system is polling for direct_post mode completion
- **THEN** system displays QR code with "Waiting for wallet response..." message
- **THEN** user can see current status

#### Scenario: Loading during DC API credential request
- **WHEN** navigator.credentials.get() is waiting for user interaction
- **THEN** system displays "Check your browser wallet..." message

#### Scenario: Loading during completion request
- **WHEN** POST /api/{flow}/complete/:requestId is in flight
- **THEN** system displays loading spinner
- **THEN** user cannot interact with form

### Requirement: Display timeout warning
The system SHALL warn users when verification is taking longer than expected.

#### Scenario: Long-running verification warning
- **WHEN** polling duration exceeds 2 minutes (120000ms)
- **THEN** system displays message "Taking too long? You can restart the request."
- **THEN** system displays restart button
- **THEN** clicking restart button clears current state and returns to mode selection

### Requirement: Handle signin "no account found" error
The system SHALL display actionable error when signin finds no matching user.

#### Scenario: Display no account error with signup link
- **WHEN** POST /api/signin/complete/:requestId returns 404 with error "No account found with this identity. Please sign up first."
- **THEN** system displays error message
- **THEN** system displays link to /signup page
- **THEN** user can click link to navigate to signup
