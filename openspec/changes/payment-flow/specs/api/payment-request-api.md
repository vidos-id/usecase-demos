# payment-request-api

## ADDED Requirements

### Requirement: Create payment authorization request
The system SHALL accept payment transaction details and create a Vidos authorization request using DCQL with the session's stored presentation mode.

#### Scenario: Create payment request with direct_post mode
- **WHEN** authenticated user posts transaction details with session mode "direct_post"
- **THEN** system generates transactionId immediately in format "txn-{timestamp}-{random8chars}"
- **THEN** system creates Vidos DCQL authorization request with claims: family_name, given_name, personal_administrative_number, document_number
- **THEN** system uses purpose "Verify your identity for payment confirmation"
- **THEN** system returns discriminated union response `{ mode: "direct_post", requestId, transactionId, authorizeUrl }`

#### Scenario: Create payment request with dc_api mode
- **WHEN** authenticated user posts transaction details with session mode "dc_api"
- **THEN** system generates transactionId immediately
- **THEN** system creates Vidos DCQL authorization request
- **THEN** system returns discriminated union response `{ mode: "dc_api", requestId, transactionId, dcApiRequest }`

#### Scenario: Create payment request without authentication
- **WHEN** unauthenticated user attempts to create payment request
- **THEN** system returns 401 Unauthorized error

#### Scenario: Create payment request with invalid amount format
- **WHEN** user posts transaction with amount not matching "^\d+\.\d{2}$" pattern
- **THEN** system returns 400 validation error

### Requirement: Request minimal PID claims
The system SHALL request only family_name, given_name, personal_administrative_number, and document_number claims for payment confirmation via DCQL.

#### Scenario: PID claims requested
- **WHEN** system creates payment authorization request
- **THEN** DCQL query contains credentials[0].claims with paths: ["family_name"], ["given_name"], ["personal_administrative_number"], ["document_number"]

### Requirement: Generate unique transaction ID on request
The system SHALL generate a unique transaction ID immediately upon payment request creation and include it in the response.

#### Scenario: Transaction ID in response
- **WHEN** payment request is created
- **THEN** response includes transactionId field
- **THEN** transactionId is stored in pending request metadata

#### Scenario: Transaction ID uniqueness
- **WHEN** multiple payment requests are created simultaneously
- **THEN** each transaction receives a distinct transaction ID

### Requirement: Poll payment authorization status
The system SHALL allow polling of payment authorization status by requestId.

#### Scenario: Poll status while pending
- **WHEN** client polls status for pending authorization
- **THEN** system returns status "pending" without claims

#### Scenario: Poll status when authorized
- **WHEN** client polls status for authorized payment
- **THEN** system returns status "authorized" with transactionId
- **THEN** system returns claims object with familyName, givenName, identifier
- **THEN** system deletes pending request from map

#### Scenario: Poll status for nonexistent requestId
- **WHEN** client polls status with unknown or expired requestId
- **THEN** system returns 404 Not Found error

### Requirement: Complete payment with verified identity
The system SHALL finalize payment after successful identity verification and validate that verified identity matches session user.

#### Scenario: Complete payment with matching identity
- **WHEN** user completes payment with credential identifier matching session user
- **THEN** system returns transaction details with confirmedAt timestamp
- **THEN** response includes verifiedIdentity object with familyName, givenName, identifier
- **THEN** response includes transaction object with id, recipient, amount, reference, confirmedAt

#### Scenario: Complete payment with mismatched identity
- **WHEN** user completes payment with credential identifier not matching session user
- **THEN** system returns 403 error "Identity mismatch"

#### Scenario: Complete payment in dc_api mode
- **WHEN** client posts DC API response to complete endpoint with `{ origin, dcResponse }`
- **THEN** system forwards dcResponse to Vidos API dc_api.jwt endpoint
- **THEN** system fetches credentials from Vidos API /credentials endpoint
- **THEN** system validates identity match and returns completion response

### Requirement: Store pending payment metadata
The system SHALL store transaction details with authorization request for retrieval on completion.

#### Scenario: Transaction metadata stored
- **WHEN** payment request is created
- **THEN** system stores transactionId, recipient, amount, reference in pending request metadata

#### Scenario: Retrieve transaction on completion
- **WHEN** payment is completed
- **THEN** system retrieves stored transactionId and transaction metadata for response

### Requirement: Validate transaction data
The system SHALL validate recipient, amount, and reference fields against schema constraints.

#### Scenario: Valid transaction data
- **WHEN** user submits recipient (1-100 chars), amount (EUR string format "123.45"), and reference (<200 chars)
- **THEN** system accepts transaction data

#### Scenario: Amount uses EUR string format
- **WHEN** user submits amount as string matching "^\d+\.\d{2}$"
- **THEN** system accepts the amount
- **WHEN** amount is not in EUR string format
- **THEN** system returns 400 validation error

#### Scenario: Recipient too long
- **WHEN** user submits recipient exceeding 100 characters
- **THEN** system returns 400 validation error

#### Scenario: Reference too long
- **WHEN** user submits reference exceeding 200 characters
- **THEN** system returns 400 validation error

#### Scenario: Missing recipient
- **WHEN** user submits transaction without recipient
- **THEN** system returns 400 validation error

### Requirement: Payment request TTL is 5 minutes
The system SHALL expire pending payment requests after 5 minutes (shorter than signup/signin).

#### Scenario: Request expires after 5 minutes
- **WHEN** pending payment request exceeds 5 minute TTL
- **THEN** system removes requestId from pendingRequests map
- **THEN** subsequent status polls return 404 Not Found
