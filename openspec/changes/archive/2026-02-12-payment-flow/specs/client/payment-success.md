# payment-success

## ADDED Requirements

### Requirement: Display success message
The system SHALL display confirmation that payment was authorized successfully.

#### Scenario: Success page renders
- **WHEN** user navigates to /send/success after successful verification
- **THEN** system displays "Payment Confirmed" title and "Transaction authorized via EUDI Wallet" description

### Requirement: Display transaction details
The system SHALL show complete transaction information including verified identity.

#### Scenario: Show transaction metadata
- **WHEN** success page renders with transactionId, recipient, amount, reference search params
- **THEN** system displays all transaction details in read-only format

#### Scenario: Show verified identity
- **WHEN** success page renders
- **THEN** system displays verified user's name (given_name + family_name) and identifier (PAN or document number)

#### Scenario: Show confirmation timestamp
- **WHEN** success page renders
- **THEN** system displays ISO-formatted confirmedAt timestamp

#### Scenario: Display without reference
- **WHEN** transaction did not include reference field
- **THEN** system displays transaction details omitting reference field

### Requirement: Display demo mode notice
The system SHALL inform user that balance is not affected in demo mode.

#### Scenario: Demo notice displayed
- **WHEN** success page renders
- **THEN** system displays alert stating "Demo mode: Your balance has not been updated. In production, €{amount} would be transferred to {recipient}."

### Requirement: Provide navigation to dashboard
The system SHALL offer button to return to main dashboard.

#### Scenario: Return to dashboard button
- **WHEN** success page renders
- **THEN** system displays "Back to Dashboard" or "Return to Dashboard" button

#### Scenario: Click return button
- **WHEN** user clicks return to dashboard button
- **THEN** system navigates to / (dashboard route)

### Requirement: Validate search parameters
The system SHALL require transactionId, recipient, and amount in URL search params.

#### Scenario: Valid search params
- **WHEN** user navigates to /send/success with transactionId, recipient, amount params
- **THEN** system renders success page with transaction details

#### Scenario: Missing required params
- **WHEN** user navigates to /send/success without transactionId, recipient, or amount
- **THEN** system shows error or redirects to dashboard

### Requirement: Require authentication
The system SHALL restrict access to authenticated users only.

#### Scenario: Authenticated user access
- **WHEN** authenticated user navigates to /send/success
- **THEN** system renders success page

#### Scenario: Unauthenticated user access
- **WHEN** unauthenticated user attempts to access /send/success
- **THEN** system redirects to sign-in page

### Requirement: Show static balance
The system SHALL not update or display changed account balance.

#### Scenario: Balance remains unchanged
- **WHEN** user returns to dashboard after successful payment
- **THEN** account balance displays same value as before payment

#### Scenario: No balance query on success page
- **WHEN** success page renders
- **THEN** system does not fetch or display account balance
