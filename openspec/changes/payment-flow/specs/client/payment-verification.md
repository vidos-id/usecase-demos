# payment-verification

## ADDED Requirements

### Requirement: Poll authorization status for direct_post mode
The system SHALL poll payment authorization status with exponential backoff until completion or timeout.

#### Scenario: Initial polling at 1 second interval
- **WHEN** verification starts in direct_post mode
- **THEN** system polls GET /api/payment/status/:requestId every 1 second initially

#### Scenario: Exponential backoff to 5 seconds
- **WHEN** polling continues beyond initial phase
- **THEN** system increases polling interval exponentially up to maximum 5 seconds

#### Scenario: Stop polling on authorized status
- **WHEN** status polling returns "authorized"
- **THEN** system stops polling and proceeds to completion

#### Scenario: Stop polling on rejected status
- **WHEN** status polling returns "rejected"
- **THEN** system stops polling and displays error message

#### Scenario: Stop polling on timeout
- **WHEN** 5 minutes elapse without authorization
- **THEN** system stops polling and displays timeout error

### Requirement: Handle DC API response for dc_api mode
The system SHALL invoke Digital Credentials API and forward response to completion endpoint.

#### Scenario: Invoke credentials.get() with dcApiRequest
- **WHEN** payment request returns dcApiRequest object
- **THEN** system calls navigator.credentials.get(dcApiRequest)

#### Scenario: Forward DigitalCredential to server
- **WHEN** credentials.get() resolves with DigitalCredential
- **THEN** system posts credential data to POST /api/payment/complete/:requestId as dcResponse

#### Scenario: Handle user cancellation
- **WHEN** user cancels wallet prompt in DC API flow
- **THEN** system catches error and displays cancellation message

#### Scenario: Handle DC API error
- **WHEN** credentials.get() rejects with error
- **THEN** system displays error message and option to retry

### Requirement: Cleanup polling on component unmount
The system SHALL cancel polling when user navigates away from confirmation page.

#### Scenario: Unmount during polling
- **WHEN** user navigates away while status polling is active
- **THEN** system cancels pending polling requests and timers

#### Scenario: Prevent memory leaks
- **WHEN** polling cleanup occurs
- **THEN** system clears all timers and aborts pending fetch requests

### Requirement: Display real-time verification status
The system SHALL show current authorization status to user during verification flow.

#### Scenario: Show pending status
- **WHEN** polling returns "pending" or "created" status
- **THEN** system displays "Waiting for wallet verification..." message

#### Scenario: Show processing status
- **WHEN** DC API invocation is in progress
- **THEN** system displays loading indicator with "Processing verification..." message

#### Scenario: Show authorized status
- **WHEN** verification succeeds and status is "authorized"
- **THEN** system displays "Verification successful" message before navigation

### Requirement: Handle authorization errors
The system SHALL provide clear error messages and recovery options for verification failures.

#### Scenario: Display rejection error
- **WHEN** authorization status is "rejected"
- **THEN** system displays "Verification rejected - transaction cancelled" with option to return to dashboard

#### Scenario: Display expiration error
- **WHEN** authorization status is "expired"
- **THEN** system displays "Verification timeout - please try again" with option to restart payment

#### Scenario: Display server error
- **WHEN** status polling or completion returns 500 error
- **THEN** system displays "Server error - please try again later" with retry option

#### Scenario: Display network error
- **WHEN** network request fails
- **THEN** system displays "Network error - check connection and retry" with retry option
