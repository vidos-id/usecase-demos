## ADDED Requirements

### Requirement: Read-only payment presentation
The system SHALL render a prefilled payment card section as display-only with no editable card fields.

#### Scenario: Render locked payment card
- **WHEN** a user enters the payment stage after successful verification
- **THEN** the system displays card details in read-only form controls or static fields

### Requirement: Deterministic mock payment confirmation
The system SHALL provide a local confirm action that transitions booking state to payment_confirmed without external payment processing.

#### Scenario: Confirm mocked payment
- **WHEN** a user activates the payment confirm action
- **THEN** the system marks payment as confirmed and advances to confirmation stage

### Requirement: Simulated payment disclosure
The system SHALL indicate that payment is simulated within the payment stage.

#### Scenario: Show simulated payment label
- **WHEN** payment stage is visible
- **THEN** the interface includes clear simulated-payment labeling
