# Loan Request API

## ADDED Requirements

### Requirement: POST /api/loan/request creates authorization with loan metadata
The system SHALL provide an endpoint POST /api/loan/request that creates a Vidos authorization request including loan details in metadata.

#### Scenario: Create loan authorization in direct_post mode
- **WHEN** client sends POST /api/loan/request with mode "direct_post", amount 25000, purpose "Car", term 24
- **THEN** system creates Vidos authorization request with attributes: family_name, given_name, personal_administrative_number, document_number
- **THEN** system includes metadata with type "loan_application", amount 25000, purpose "Car", term 24
- **THEN** system returns 200 with requestId and authorizeUrl

#### Scenario: Create loan authorization in dc_api mode
- **WHEN** client sends POST /api/loan/request with mode "dc_api", amount 50000, purpose "Education", term 36
- **THEN** system creates Vidos authorization request with attributes: family_name, given_name, personal_administrative_number, document_number
- **THEN** system includes metadata with type "loan_application", amount 50000, purpose "Education", term 36
- **THEN** system returns 200 with requestId and dcApiRequest object

### Requirement: Request validates loan parameters against allowed values
The system SHALL validate that amount, purpose, and term match allowed constant values defined in shared/types/loan.ts.

#### Scenario: Valid loan parameters accepted
- **WHEN** client sends amount 25000 (valid), purpose "Car" (valid), term 24 (valid)
- **THEN** system accepts the request
- **THEN** system creates authorization request

#### Scenario: Invalid amount rejected
- **WHEN** client sends amount 15000 (not in allowed values)
- **THEN** system returns 400 Bad Request
- **THEN** system returns validation error indicating invalid amount

#### Scenario: Invalid purpose rejected
- **WHEN** client sends purpose "Vacation" (not in allowed values)
- **THEN** system returns 400 Bad Request
- **THEN** system returns validation error indicating invalid purpose

#### Scenario: Invalid term rejected
- **WHEN** client sends term 18 (not in allowed values)
- **THEN** system returns 400 Bad Request
- **THEN** system returns validation error indicating invalid term

### Requirement: Request stores pending authorization in server memory
The system SHALL store the pending authorization request with loan details in a pendingRequests map for later status checks and completion.

#### Scenario: Store pending request with loan details
- **WHEN** system creates Vidos authorization request with authId "auth_123"
- **THEN** system stores in pendingRequests map with key requestId
- **THEN** stored value includes authId "auth_123", status "created", loan amount 25000, purpose "Car", term 24

#### Scenario: Pending request accessible for status polling
- **WHEN** client later calls GET /api/loan/status/:requestId
- **THEN** system retrieves pending request from map using requestId
- **THEN** system can poll Vidos API using stored authId

### Requirement: Request uses session's stored presentation mode
The system SHALL accept mode parameter from client (direct_post or dc_api) retrieved from session storage.

#### Scenario: Client provides stored mode
- **WHEN** client sends mode "dc_api" from session storage
- **THEN** system creates authorization request with dc_api mode
- **THEN** system returns dcApiRequest in response

#### Scenario: Client provides direct_post mode
- **WHEN** client sends mode "direct_post" from session storage
- **THEN** system creates authorization request with direct_post mode
- **THEN** system returns authorizeUrl in response

### Requirement: Request requires authenticated session
The system SHALL require an authenticated session to create a loan authorization request.

#### Scenario: Authenticated user creates request
- **WHEN** authenticated user sends POST /api/loan/request
- **THEN** system processes the request
- **THEN** system returns 200 with requestId

#### Scenario: Unauthenticated request rejected
- **WHEN** unauthenticated client sends POST /api/loan/request
- **THEN** system returns 401 Unauthorized
- **THEN** system does not create authorization request
