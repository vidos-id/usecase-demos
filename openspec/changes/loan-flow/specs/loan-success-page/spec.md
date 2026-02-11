# Loan Success Page

## ADDED Requirements

### Requirement: Success page displays application submitted message
The system SHALL display a confirmation page at route `/loan/success` with heading "Application Submitted".

#### Scenario: User sees submission confirmation
- **WHEN** user navigates to `/loan/success` after completing loan verification
- **THEN** system displays heading "Application Submitted"

### Requirement: Success page sets review timeline expectation
The system SHALL display a message "We'll review your application and contact you within 2 business days" on the success page.

#### Scenario: User sees review timeline
- **WHEN** user views `/loan/success` page
- **THEN** system displays message "We'll review your application and contact you within 2 business days"

### Requirement: Success page provides navigation to dashboard
The system SHALL provide a "Return to Dashboard" button that navigates user back to `/dashboard`.

#### Scenario: User returns to dashboard
- **WHEN** user clicks "Return to Dashboard" button
- **THEN** system navigates to `/dashboard` route

### Requirement: Success page is accessible only to authenticated users
The system SHALL require authentication to access the loan success page.

#### Scenario: Authenticated user accesses success page
- **WHEN** authenticated user navigates to `/loan/success`
- **THEN** system displays the success page

#### Scenario: Unauthenticated user redirected
- **WHEN** unauthenticated user navigates to `/loan/success`
- **THEN** system redirects to landing page (`/`)

### Requirement: Success page does not display loan approval status
The system SHALL NOT display any message suggesting loan approval or instant decision.

#### Scenario: No misleading approval message
- **WHEN** user views `/loan/success` page
- **THEN** system does not display "Loan Approved" or similar messaging
- **THEN** system maintains expectation that application is under review

### Requirement: Success page does not provide loan status tracking
The system SHALL NOT provide a "Check Status" button or loan tracking functionality on the success page.

#### Scenario: No status tracking link
- **WHEN** user views `/loan/success` page
- **THEN** system does not display "Check Status" button
- **THEN** system does not provide link to loan status tracking
