## ADDED Requirements

### Requirement: Booking confirmation output
The system SHALL present a final confirmation stage containing booking reference and rental summary.

#### Scenario: Show completed booking summary
- **WHEN** payment has been confirmed in the demo flow
- **THEN** the system displays booking reference and core rental details in confirmation

### Requirement: Self pickup instructions
The system SHALL provide self pickup details including locker ID and locker PIN in confirmation output.

#### Scenario: Show locker handoff details
- **WHEN** booking reaches confirmation stage
- **THEN** the system displays pickup location guidance, locker ID, and locker PIN

### Requirement: Eligibility statement at completion
The system SHALL provide a completion eligibility statement derived from verification outcome.

#### Scenario: Display verified-for-rental status
- **WHEN** verification status is successful and booking is completed
- **THEN** the confirmation includes a clear eligible-for-rental statement
