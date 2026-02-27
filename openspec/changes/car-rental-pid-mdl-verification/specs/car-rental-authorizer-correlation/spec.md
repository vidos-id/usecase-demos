## ADDED Requirements

### Requirement: Authorizer and booking correlation
The system SHALL correlate each verifier session using `authorizerId` linked to the originating `bookingId`.

#### Scenario: Store verifier correlation
- **WHEN** verification request creation returns `authorizerId`
- **THEN** the system stores a correlation record linking `authorizerId` to `bookingId`

### Requirement: Correlation persistence
The system SHALL persist `authorizerId` and `bookingId` correlation locally to survive refresh and route transitions.

#### Scenario: Recover correlation after refresh
- **WHEN** a user refreshes during pending verification
- **THEN** the system restores the correlation and resumes status retrieval for the same booking

### Requirement: Correlation integrity check
The system SHALL reject verifier results that do not match the expected `authorizerId` to `bookingId` mapping.

#### Scenario: Ignore mismatched result
- **WHEN** a retrieved result references a different booking correlation than current flow
- **THEN** the system marks the event as invalid and does not apply it to booking state
