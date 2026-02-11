# Loan Application Form

## ADDED Requirements

### Requirement: User can select loan amount from preset options
The system SHALL provide a dropdown allowing users to select from preset loan amounts: EUR 5,000, EUR 10,000, EUR 25,000, and EUR 50,000.

#### Scenario: User selects EUR 25,000
- **WHEN** user opens the loan amount dropdown
- **THEN** system displays four options: EUR 5,000, EUR 10,000, EUR 25,000, and EUR 50,000
- **WHEN** user selects EUR 25,000
- **THEN** system sets the loan amount to 25000

#### Scenario: No default amount is selected
- **WHEN** user navigates to the loan application form
- **THEN** system displays the amount dropdown with no default value selected
- **THEN** user must explicitly select an amount before submitting

### Requirement: User can select loan purpose
The system SHALL provide a dropdown allowing users to select loan purpose from: Car, Home Improvement, Education, and Other.

#### Scenario: User selects Car purpose
- **WHEN** user opens the loan purpose dropdown
- **THEN** system displays four options: Car, Home Improvement, Education, and Other
- **WHEN** user selects Car
- **THEN** system sets the loan purpose to "Car"

#### Scenario: No default purpose is selected
- **WHEN** user navigates to the loan application form
- **THEN** system displays the purpose dropdown with no default value selected
- **THEN** user must explicitly select a purpose before submitting

### Requirement: User can select loan term in months
The system SHALL provide a dropdown allowing users to select loan term from: 12 months, 24 months, 36 months, and 48 months.

#### Scenario: User selects 24 month term
- **WHEN** user opens the loan term dropdown
- **THEN** system displays four options: 12 months, 24 months, 36 months, and 48 months
- **WHEN** user selects 24 months
- **THEN** system sets the loan term to 24

#### Scenario: No default term is selected
- **WHEN** user navigates to the loan application form
- **THEN** system displays the term dropdown with no default value selected
- **THEN** user must explicitly select a term before submitting

### Requirement: User can submit loan application
The system SHALL provide a submit button that triggers PID verification when all required fields are selected.

#### Scenario: Submit with all fields complete
- **WHEN** user has selected amount EUR 25,000, purpose Car, and term 24 months
- **WHEN** user clicks the submit button
- **THEN** system initiates PID verification flow inline on the same page

#### Scenario: Submit with missing fields
- **WHEN** user has not selected all required fields (amount, purpose, term)
- **WHEN** user attempts to submit
- **THEN** system displays validation error indicating which fields are required

### Requirement: Loan application form is accessible only to authenticated users
The system SHALL require user authentication to access the loan application form at route `/loan`.

#### Scenario: Authenticated user accesses loan form
- **WHEN** authenticated user navigates to `/loan`
- **THEN** system displays the loan application form

#### Scenario: Unauthenticated user attempts access
- **WHEN** unauthenticated user navigates to `/loan`
- **THEN** system redirects to landing page (`/`)
