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
- **THEN** response includes loanRequestId
- **THEN** response includes claims with familyName, givenName, identifier
- **THEN** system deletes pending request from map

#### Scenario: Poll status for rejected request
- **WHEN** client sends GET /api/loan/status/req_123
- **WHEN** Vidos authorization was rejected
- **THEN** system returns 200 with status "rejected"
- **THEN** response does not include claims

#### Scenario: Poll status for expired request
- **WHEN** client sends GET /api/loan/status/req_123
- **WHEN** pending request has exceeded 5 minute TTL
- **THEN** system returns 404 Not Found (request removed from map)

### Requirement: Status endpoint retrieves from Vidos API
The system SHALL poll the Vidos API to get the current authorization status using the stored authId.

#### Scenario: Retrieve status from Vidos
- **WHEN** client polls GET /api/loan/status/req_123
- **WHEN** pendingRequests map contains authId "auth_xyz" for requestId "req_123"
- **THEN** system calls Vidos API GET /authorizations/{authId}/status
- **THEN** system returns Vidos status to client

### Requirement: Status endpoint handles unknown requestId
The system SHALL return 404 error when requestId is not found in pending requests.

#### Scenario: Unknown requestId returns error
- **WHEN** client sends GET /api/loan/status/unknown_id
- **WHEN** requestId "unknown_id" does not exist in pendingRequests map
- **THEN** system returns 404 Not Found
- **THEN** response includes error message "Request not found"

### Requirement: Identity verification on authorization
The system SHALL verify that the presented credential matches the session user.

#### Scenario: Identity matches session user
- **WHEN** authorization is completed
- **THEN** system fetches credentials from Vidos API /credentials endpoint
- **THEN** system compares credential identifier with session user identifier
- **THEN** system allows completion if identifiers match

#### Scenario: Identity mismatch
- **WHEN** credential identifier does not match session user identifier
- **THEN** system returns 403 Forbidden with error "Identity mismatch"

### Requirement: POST /api/loan/complete/:requestId finalizes authorization
The system SHALL provide an endpoint POST /api/loan/complete/:requestId that processes the completed authorization.

#### Scenario: Complete loan authorization in dc_api mode
- **WHEN** client sends POST /api/loan/complete/req_123 with `{ origin, dcResponse }`
- **THEN** system forwards dcResponse to Vidos API dc_api.jwt endpoint
- **THEN** system fetches credentials from Vidos API /credentials endpoint
- **THEN** system verifies identity matches session user
- **THEN** system generates loanRequestId
- **THEN** system deletes pending request from map
- **THEN** system returns 200 with loanRequestId and message

#### Scenario: Complete unknown requestId fails
- **WHEN** client sends POST /api/loan/complete/unknown_id
- **THEN** system returns 404 Not Found
- **THEN** response includes error "Request not found or expired"

### Requirement: Completion endpoint requires authenticated session
The system SHALL require an authenticated session to complete a loan authorization.

#### Scenario: Authenticated user completes request
- **WHEN** authenticated user sends POST /api/loan/complete/req_123 with Authorization header
- **THEN** system processes the completion
- **THEN** system returns 200 with loanRequestId

#### Scenario: Unauthenticated completion rejected
- **WHEN** unauthenticated client sends POST /api/loan/complete/req_123
- **THEN** system returns 401 Unauthorized
- **THEN** system does not complete the authorization

### Requirement: Loan request TTL is 5 minutes
The system SHALL expire pending loan requests after 5 minutes (shorter than signup/signin).

#### Scenario: Request expires after 5 minutes
- **WHEN** pending loan request exceeds 5 minute TTL
- **THEN** system removes requestId from pendingRequests map
- **THEN** subsequent status polls return 404 Not Found
