# Loan Verification Flow

## ADDED Requirements

### Requirement: System initiates PID verification inline after form submission
The system SHALL trigger PID identity verification inline on the loan application page when the user submits the loan form.

#### Scenario: Form submission triggers inline verification
- **WHEN** user submits loan application with amount EUR 25,000, purpose Car, term 24 months
- **THEN** system maintains user on `/loan` route
- **THEN** system displays "Verify Identity" step inline on the same page

### Requirement: System adapts verification to stored session mode
The system SHALL use the presentation mode stored in the user's session (direct_post or dc_api) for loan verification.

#### Scenario: direct_post mode stored in session
- **WHEN** user's session has mode "direct_post" stored
- **WHEN** user submits loan application
- **THEN** system creates Vidos authorization request with direct_post mode
- **THEN** system displays QR code for wallet scanning

#### Scenario: dc_api mode stored in session
- **WHEN** user's session has mode "dc_api" stored
- **WHEN** user submits loan application
- **THEN** system creates Vidos authorization request with dc_api mode
- **THEN** system triggers Device Channel API flow

#### Scenario: No mode stored in session
- **WHEN** user's session has no mode stored
- **THEN** system defaults to direct_post mode
- **THEN** system displays QR code for wallet scanning

### Requirement: System requests same PID attributes as payment verification
The system SHALL request the following PID attributes for loan verification: family_name, given_name, personal_administrative_number, and document_number.

#### Scenario: Loan verification requests PID attributes
- **WHEN** system creates Vidos authorization request for loan
- **THEN** system requests attributes: family_name, given_name, personal_administrative_number, document_number
- **THEN** these attributes match those used in payment verification flow

### Requirement: System includes loan details in authorization metadata
The system SHALL include loan amount, purpose, and term in the Vidos authorization request metadata.

#### Scenario: Loan metadata included in auth request
- **WHEN** user submits loan for EUR 25,000, Car, 24 months
- **WHEN** system creates Vidos authorization request
- **THEN** system includes metadata with type "loan_application"
- **THEN** metadata includes amount 25000, purpose "Car", term 24

#### Scenario: Metadata provides audit trail
- **WHEN** authorization request is created with loan metadata
- **THEN** Vidos API logs include context of loan application
- **THEN** verification can be traced to specific loan details

### Requirement: System polls authorization status for direct_post mode
The system SHALL poll the authorization status endpoint while waiting for user to complete wallet verification in direct_post mode.

#### Scenario: Polling detects authorized status
- **WHEN** user is verifying identity via QR code (direct_post mode)
- **WHEN** system polls GET /api/loan/status/:requestId
- **WHEN** status changes to "authorized"
- **THEN** system stops polling
- **THEN** system proceeds to completion step

#### Scenario: Polling handles timeout
- **WHEN** user does not complete verification within 5 minutes
- **WHEN** status changes to "expired"
- **THEN** system stops polling
- **THEN** system displays timeout message with "Try Again" button

### Requirement: System handles Device Channel API callback for dc_api mode
The system SHALL receive and process the Device Channel API callback when verification completes in dc_api mode.

#### Scenario: DC API callback triggers completion
- **WHEN** user verifies identity via Device Channel API
- **WHEN** DC API posts response to completion endpoint
- **THEN** system processes the callback
- **THEN** system marks authorization as authorized
- **THEN** system proceeds to success page

### Requirement: System transitions to success page after verification completes
The system SHALL navigate user to `/loan/success` route after successful identity verification.

#### Scenario: Successful verification redirects to success
- **WHEN** authorization status becomes "authorized"
- **WHEN** system calls POST /api/loan/complete/:requestId
- **WHEN** completion succeeds
- **THEN** system navigates to `/loan/success`

#### Scenario: Verification failure shows error
- **WHEN** authorization status becomes "rejected" or "error"
- **THEN** system displays error message
- **THEN** system offers "Try Again" button to restart loan application
