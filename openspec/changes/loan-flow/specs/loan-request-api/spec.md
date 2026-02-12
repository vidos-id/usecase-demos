# Loan Request API

## ADDED Requirements

### Requirement: POST /api/loan/request creates authorization request
The system SHALL provide an endpoint POST /api/loan/request that creates a Vidos authorization request using DCQL. Loan details are stored locally but NOT sent to Vidos as metadata.

#### Scenario: Create loan authorization in direct_post mode
- **WHEN** client sends POST /api/loan/request with amount "25000", purpose "Car", term "24"
- **THEN** system creates Vidos DCQL authorization request with claims: personal_administrative_number, family_name, given_name
- **THEN** system uses purpose "Verify your identity for loan application"
- **THEN** system returns 200 with discriminated union response `{ mode: "direct_post", requestId, authorizeUrl }`

#### Scenario: Create loan authorization in dc_api mode
- **WHEN** client sends POST /api/loan/request with amount "50000", purpose "Education", term "36"
- **THEN** system creates Vidos DCQL authorization request with claims: personal_administrative_number, family_name, given_name
- **THEN** system uses purpose "Verify your identity for loan application"
- **THEN** system returns 200 with discriminated union response `{ mode: "dc_api", requestId, dcApiRequest }`

### Requirement: Request validates loan parameters against allowed values
The system SHALL validate that amount, purpose, and term match allowed constant values defined in shared/types/loan.ts.

#### Scenario: Valid loan parameters accepted
- **WHEN** client sends amount "25000" (valid), purpose "Car" (valid), term "24" (valid)
- **THEN** system accepts the request
- **THEN** system creates authorization request

#### Scenario: Invalid amount rejected
- **WHEN** client sends amount "15000" (not in allowed values)
- **THEN** system returns 400 Bad Request
- **THEN** system returns validation error indicating invalid amount

#### Scenario: Invalid purpose rejected
- **WHEN** client sends purpose "Vacation" (not in allowed values)
- **THEN** system returns 400 Bad Request
- **THEN** system returns validation error indicating invalid purpose

#### Scenario: Invalid term rejected
- **WHEN** client sends term "18" (not in allowed values)
- **THEN** system returns 400 Bad Request
- **THEN** system returns validation error indicating invalid term

### Requirement: Request stores pending authorization in server memory
The system SHALL store the pending authorization request with loan details in a pendingRequests map for later status checks and completion.

#### Scenario: Store pending request with loan details
- **WHEN** system creates Vidos authorization request with authId "auth_123"
- **THEN** system stores in pendingRequests map with key requestId
- **THEN** stored value includes authId "auth_123", type "loan", mode, and loan metadata (amount, purpose, term)

#### Scenario: Pending request accessible for status polling
- **WHEN** client later calls GET /api/loan/status/:requestId
- **THEN** system retrieves pending request from map using requestId
- **THEN** system can poll Vidos API using stored authId

### Requirement: Request uses session's stored presentation mode
The system SHALL use the mode from the authenticated session for the authorization request.

#### Scenario: Session mode dc_api
- **WHEN** authenticated session has mode "dc_api"
- **THEN** system creates authorization request with dc_api mode
- **THEN** system returns discriminated union response with `mode: "dc_api"` and dcApiRequest

#### Scenario: Session mode direct_post
- **WHEN** authenticated session has mode "direct_post"
- **THEN** system creates authorization request with direct_post mode
- **THEN** system returns discriminated union response with `mode: "direct_post"` and authorizeUrl

### Requirement: Request requires authenticated session
The system SHALL require an authenticated session to create a loan authorization request.

#### Scenario: Authenticated user creates request
- **WHEN** authenticated user sends POST /api/loan/request with Authorization header
- **THEN** system processes the request
- **THEN** system returns 200 with requestId

#### Scenario: Unauthenticated request rejected
- **WHEN** unauthenticated client sends POST /api/loan/request
- **THEN** system returns 401 Unauthorized
- **THEN** system does not create authorization request

### Requirement: Loan parameters use string enum values
The system SHALL accept loan parameters as string enum values matching shared/types/loan.ts.

#### Scenario: Amount as string enum
- **WHEN** client sends amount as "5000", "10000", "25000", or "50000"
- **THEN** system accepts the value

#### Scenario: Term as string enum
- **WHEN** client sends term as "12", "24", "36", or "48"
- **THEN** system accepts the value
