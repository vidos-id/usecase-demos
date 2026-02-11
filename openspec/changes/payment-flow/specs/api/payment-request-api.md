# payment-request-api

## ADDED Requirements

### Requirement: Create payment authorization request
The system SHALL accept payment transaction details and create a Vidos authorization request using the session's stored presentation mode.

#### Scenario: Create payment request with direct_post mode
- **WHEN** authenticated user posts transaction details with session mode "direct_post"
- **THEN** system creates Vidos authorization request with direct_post mode, returns requestId, transactionId, and authorizeUrl

#### Scenario: Create payment request with dc_api mode
- **WHEN** authenticated user posts transaction details with session mode "dc_api"
- **THEN** system creates Vidos authorization request with dc_api mode, returns requestId, transactionId, and dcApiRequest

#### Scenario: Create payment request without authentication
- **WHEN** unauthenticated user attempts to create payment request
- **THEN** system returns 401 Unauthorized error

#### Scenario: Create payment request with invalid amount format
- **WHEN** user posts transaction with amount not matching "^\d+\.\d{2}$" pattern
- **THEN** system returns 400 validation error

### Requirement: Request minimal PID attributes
The system SHALL request only family_name, given_name, personal_administrative_number, and document_number attributes for payment confirmation.

#### Scenario: PID attributes requested
- **WHEN** system creates payment authorization request
- **THEN** Vidos authorization request includes attributes: family_name, given_name, personal_administrative_number, document_number

### Requirement: Generate unique transaction ID
The system SHALL generate a unique transaction ID immediately upon payment request creation.

#### Scenario: Transaction ID generated
- **WHEN** payment request is created
- **THEN** system generates transaction ID in format "txn-{timestamp}-{random8chars}"

#### Scenario: Transaction ID uniqueness
- **WHEN** multiple payment requests are created simultaneously
- **THEN** each transaction receives a distinct transaction ID

### Requirement: Poll payment authorization status
The system SHALL allow polling of payment authorization status by requestId for direct_post mode.

#### Scenario: Poll status while pending
- **WHEN** client polls status for pending authorization
- **THEN** system returns status "pending" without claims

#### Scenario: Poll status when authorized
- **WHEN** client polls status for authorized payment
- **THEN** system returns status "authorized" with normalized PID claims

#### Scenario: Poll status when expired
- **WHEN** client polls status for expired authorization (>5 minutes)
- **THEN** system returns status "expired"

#### Scenario: Poll status for nonexistent requestId
- **WHEN** client polls status with invalid requestId
- **THEN** system returns 404 Not Found error

### Requirement: Complete payment with verified identity
The system SHALL finalize payment after successful identity verification and validate that verified identity matches session user.

#### Scenario: Complete payment with matching identity
- **WHEN** user completes payment with PID matching session identifier
- **THEN** system returns transaction details with confirmedAt timestamp and verified identity

#### Scenario: Complete payment with mismatched identity
- **WHEN** user completes payment with PID not matching session identifier
- **THEN** system returns 403 error "Identity verification failed - please sign in again"

#### Scenario: Complete payment in dc_api mode
- **WHEN** client posts DC API response to complete endpoint
- **THEN** system extracts claims from dcResponse and validates identity match

#### Scenario: Complete payment in direct_post mode
- **WHEN** client posts to complete endpoint after polling shows authorized
- **THEN** system retrieves claims from Vidos API and validates identity match

### Requirement: Store pending payment metadata
The system SHALL store transaction details with authorization request for retrieval on completion.

#### Scenario: Transaction metadata stored
- **WHEN** payment request is created
- **THEN** system stores recipient, amount, reference, requestId, transactionId, authId, mode, and createdAt timestamp

#### Scenario: Retrieve transaction on completion
- **WHEN** payment is completed
- **THEN** system retrieves original transaction metadata and includes in completion response

### Requirement: Validate transaction data
The system SHALL validate recipient, amount, and reference fields against schema constraints.

#### Scenario: Valid transaction data
- **WHEN** user submits recipient (1-100 chars), amount (EUR format), and reference (<200 chars)
- **THEN** system accepts transaction data

#### Scenario: Recipient too long
- **WHEN** user submits recipient exceeding 100 characters
- **THEN** system returns 400 validation error

#### Scenario: Reference too long
- **WHEN** user submits reference exceeding 200 characters
- **THEN** system returns 400 validation error

#### Scenario: Missing recipient
- **WHEN** user submits transaction without recipient
- **THEN** system returns 400 validation error
