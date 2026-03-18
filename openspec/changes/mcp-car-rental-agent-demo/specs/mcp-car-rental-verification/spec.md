## ADDED Requirements

### Requirement: Vehicle-aware PID plus mDL request

The MCP booking flow SHALL request both PID and mDL credentials when the selected vehicle requires trust checks for booking approval. The request SHALL be correlated to the booking session and SHALL ask only for the claims needed to evaluate age, driving-licence validity, and required driving privileges.

#### Scenario: Booking starts verification for selected car
- **WHEN** the user confirms they want to book the selected vehicle
- **THEN** the system creates a booking-linked authorization request that includes PID and mDL requirements

#### Scenario: Vehicle requirements shape verification context
- **WHEN** the selected vehicle has a required minimum age or required licence category
- **THEN** the created verification context includes those requirements in the booking snapshot returned to the agent and UI

### Requirement: Booking-linked verification lifecycle

The system SHALL track verification state per booking session using a lifecycle of `created -> pending_wallet -> processing -> success | rejected | expired | error`. The lifecycle SHALL be queryable by tools used by both the model and the MCP App UI.

#### Scenario: Wallet verification remains queryable while pending
- **WHEN** a verification session is waiting for wallet presentation or authorizer processing
- **THEN** booking-status lookup returns the current lifecycle state without losing the booking correlation

#### Scenario: Terminal verification state blocks or unlocks booking
- **WHEN** verification reaches a terminal state
- **THEN** the booking snapshot reflects whether the booking may proceed or must stop

### Requirement: Normalized eligibility evaluation

The system SHALL normalize authorizer outputs into a stable rental-eligibility result. The normalized result SHALL include minimum-age evaluation, required licence category, presented licence categories, licence validity, and an overall booking approval outcome.

#### Scenario: Eligible renter is approved
- **WHEN** the disclosed PID and mDL claims satisfy the selected vehicle requirements
- **THEN** the normalized eligibility result marks the booking as approved

#### Scenario: Underage or incompatible licence is rejected
- **WHEN** the disclosed claims fail the minimum-age check or required licence-category check
- **THEN** the normalized eligibility result marks the booking as rejected and provides a machine-readable failure reason
