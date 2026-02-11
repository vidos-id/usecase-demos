# payment-form

## ADDED Requirements

### Requirement: Display transaction entry form
The system SHALL display a payment form with recipient, amount, and reference fields.

#### Scenario: Form renders with empty fields
- **WHEN** authenticated user navigates to /send route
- **THEN** system displays form with empty recipient field, empty amount field, and empty optional reference field

#### Scenario: Unauthenticated user access
- **WHEN** unauthenticated user attempts to access /send route
- **THEN** system redirects to sign-in page

### Requirement: Display pre-filled recipient templates
The system SHALL display a sidebar with pre-filled recipient templates showing name and suggested amount.

#### Scenario: Templates displayed
- **WHEN** user views payment form
- **THEN** system displays at least 3 hardcoded templates with recipient name and amount

#### Scenario: Template content
- **WHEN** templates are rendered
- **THEN** each template shows id, name (e.g., "John's Coffee Shop"), and amount (e.g., "45.00")

### Requirement: Auto-fill form from template
The system SHALL auto-fill recipient and amount fields when user selects a template.

#### Scenario: Click template auto-fills fields
- **WHEN** user clicks a recipient template
- **THEN** system populates recipient field with template name and amount field with template amount

#### Scenario: Template auto-fill preserves reference
- **WHEN** user has entered reference text and clicks template
- **THEN** system updates recipient and amount but preserves reference field value

#### Scenario: Template fields remain editable
- **WHEN** user clicks template to auto-fill
- **THEN** recipient and amount fields remain editable for manual changes

### Requirement: Validate amount format
The system SHALL enforce EUR amount format with exactly 2 decimal places.

#### Scenario: Valid EUR amount entered
- **WHEN** user enters amount matching pattern "^\d+\.\d{2}$"
- **THEN** form accepts the amount value

#### Scenario: Invalid amount format entered
- **WHEN** user enters amount without 2 decimal places (e.g., "45" or "45.5")
- **THEN** form shows validation error message

#### Scenario: Negative amount rejected
- **WHEN** user enters negative amount
- **THEN** form shows validation error message

### Requirement: Navigate to confirmation with transaction data
The system SHALL navigate to confirmation page with transaction details in URL search parameters when user submits form.

#### Scenario: Valid form submission
- **WHEN** user fills all required fields and clicks Continue button
- **THEN** system navigates to /send/confirm with recipient, amount, and reference as search params

#### Scenario: Submission without recipient
- **WHEN** user clicks Continue without entering recipient
- **THEN** form shows validation error and prevents navigation

#### Scenario: Submission without amount
- **WHEN** user clicks Continue without entering amount
- **THEN** form shows validation error and prevents navigation

#### Scenario: Submission without reference
- **WHEN** user clicks Continue with empty reference field
- **THEN** system navigates to /send/confirm with recipient and amount, omitting reference param

### Requirement: Recipient field validation
The system SHALL validate recipient field has 1-100 characters.

#### Scenario: Valid recipient entered
- **WHEN** user enters recipient with 1-100 characters
- **THEN** form accepts the recipient value

#### Scenario: Empty recipient rejected
- **WHEN** user leaves recipient field empty
- **THEN** form shows required field error

#### Scenario: Recipient too long
- **WHEN** user enters recipient exceeding 100 characters
- **THEN** form shows length validation error

### Requirement: Reference field validation
The system SHALL validate reference field does not exceed 200 characters.

#### Scenario: Valid reference entered
- **WHEN** user enters reference up to 200 characters
- **THEN** form accepts the reference value

#### Scenario: Empty reference allowed
- **WHEN** user leaves reference field empty
- **THEN** form allows submission without reference

#### Scenario: Reference too long
- **WHEN** user enters reference exceeding 200 characters
- **THEN** form shows length validation error
