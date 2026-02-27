## ADDED Requirements

### Requirement: Deterministic fallback mode
The system SHALL provide a fallback mode that can complete the full journey without live verifier dependency success.

#### Scenario: Complete flow in fallback mode
- **WHEN** fallback mode is active and user executes full rental journey
- **THEN** the system supports progression from booking through confirmation deterministically

### Requirement: Verification failure recovery
The system SHALL provide retry or restart actions for rejected, expired, and error verification outcomes.

#### Scenario: Recover from expired verification
- **WHEN** verification reaches expired status
- **THEN** the system presents actions to retry verification or restart flow

### Requirement: Local state corruption recovery
The system SHALL detect malformed persisted state and recover by resetting invalid records safely.

#### Scenario: Recover from invalid persisted data
- **WHEN** persisted booking or verification state fails validation during restore
- **THEN** the system discards invalid records and routes user to a safe restart state
