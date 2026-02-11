# Loan Status API

## ADDED Requirements

### Requirement: GET /api/loan/status/:requestId polls authorization status
The system SHALL provide an endpoint GET /api/loan/status/:requestId that returns the current status of a loan authorization request.

#### Scenario: Poll status for pending authorization
- **WHEN** client sends GET /api/loan/status/req_123
- **WHEN** Vidos authorization is still pending
- **THEN** system returns 200 with status "pending"
- **THEN** response does not include claims

#### Scenario: Poll status for authorized request
- **WHEN** client sends GET /api/loan/status/req_123
- **WHEN** Vidos authorization has been completed and authorized
- **THEN** system returns 200 with status "authorized"
- **THEN** response includes claims with familyName, givenName, personalAdministrativeNumber or documentNumber

#### Scenario: Poll status for rejected request
- **WHEN** client sends GET /api/loan/status/req_123
- **WHEN** Vidos authorization was rejected
- **THEN** system returns 200 with status "rejected"
- **THEN** response does not include claims

#### Scenario: Poll status for expired request
- **WHEN** client sends GET /api/loan/status/req_123
- **WHEN** Vidos authorization has expired (timeout after 5 minutes)
- **THEN** system returns 200 with status "expired"
- **THEN** response does not include claims

### Requirement: Status endpoint retrieves from Vidos API
The system SHALL poll the Vidos API to get the current authorization status using the stored authId.

#### Scenario: Retrieve status from Vidos
- **WHEN** client polls GET /api/loan/status/req_123
- **WHEN** pendingRequests map contains authId "auth_xyz" for requestId "req_123"
- **THEN** system calls Vidos API pollAuthorizationStatus with authId "auth_xyz"
- **THEN** system returns Vidos status to client

### Requirement: Status endpoint handles unknown requestId
The system SHALL return error when requestId is not found in pending requests.

#### Scenario: Unknown requestId returns error
- **WHEN** client sends GET /api/loan/status/unknown_id
- **WHEN** requestId "unknown_id" does not exist in pendingRequests map
- **THEN** system returns 404 Not Found
- **THEN** response includes error message "Request not found"

### Requirement: Status endpoint is idempotent and stateless
The system SHALL allow repeated polling of the same requestId without side effects.

#### Scenario: Multiple polls return consistent status
- **WHEN** client sends GET /api/loan/status/req_123 multiple times
- **WHEN** authorization status remains "pending"
- **THEN** each request returns 200 with status "pending"
- **THEN** pendingRequests state is not modified by polling

### Requirement: POST /api/loan/complete/:requestId finalizes authorization
The system SHALL provide an endpoint POST /api/loan/complete/:requestId that processes the completed authorization and logs the loan application.

#### Scenario: Complete loan authorization in direct_post mode
- **WHEN** client sends POST /api/loan/complete/req_123
- **WHEN** authorization status is "authorized"
- **WHEN** mode is direct_post
- **THEN** system fetches verified credentials from Vidos API
- **THEN** system logs loan application with extracted claims and loan details
- **THEN** system returns 200 with loanRequestId and message "Application submitted successfully"
- **THEN** system removes requestId from pendingRequests map

#### Scenario: Complete loan authorization in dc_api mode
- **WHEN** client sends POST /api/loan/complete/req_123 with dcResponse
- **WHEN** authorization status is "authorized"
- **WHEN** mode is dc_api
- **THEN** system processes dcResponse to extract claims
- **THEN** system logs loan application with extracted claims and loan details
- **THEN** system returns 200 with loanRequestId and message "Application submitted successfully"
- **THEN** system removes requestId from pendingRequests map

#### Scenario: Complete before authorization fails
- **WHEN** client sends POST /api/loan/complete/req_123
- **WHEN** authorization status is "pending" (not yet authorized)
- **THEN** system returns 400 Bad Request
- **THEN** response includes error "Authorization not yet completed"

#### Scenario: Complete unknown requestId fails
- **WHEN** client sends POST /api/loan/complete/unknown_id
- **THEN** system returns 404 Not Found
- **THEN** response includes error "Request not found"

### Requirement: Completion endpoint cleans up pending request
The system SHALL remove the requestId from pendingRequests map after successful completion.

#### Scenario: Cleanup after successful completion
- **WHEN** POST /api/loan/complete/req_123 succeeds
- **THEN** system deletes "req_123" from pendingRequests map
- **THEN** subsequent GET /api/loan/status/req_123 returns 404

### Requirement: Completion endpoint requires authenticated session
The system SHALL require an authenticated session to complete a loan authorization.

#### Scenario: Authenticated user completes request
- **WHEN** authenticated user sends POST /api/loan/complete/req_123
- **THEN** system processes the completion
- **THEN** system returns 200 with loanRequestId

#### Scenario: Unauthenticated completion rejected
- **WHEN** unauthenticated client sends POST /api/loan/complete/req_123
- **THEN** system returns 401 Unauthorized
- **THEN** system does not complete the authorization
