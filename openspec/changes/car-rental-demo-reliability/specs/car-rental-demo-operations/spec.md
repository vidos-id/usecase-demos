## ADDED Requirements

### Requirement: Fast demo reset control
The system SHALL provide a reset action that clears local flow state and returns the app to initial entry state.

#### Scenario: Reset demo state
- **WHEN** operator triggers reset action
- **THEN** booking, verification, and payment progression state is cleared and app returns to start

### Requirement: Operator lifecycle traceability
The system SHALL maintain a local timeline of key booking and verification lifecycle milestones for the active demo session.

#### Scenario: View current session timeline
- **WHEN** operator opens demo operations or debug panel
- **THEN** the system shows ordered milestones including booking creation, verification states, and completion status

### Requirement: Fallback mode visibility
The system SHALL visibly indicate fallback mode whenever fallback behavior is active.

#### Scenario: Display fallback indicator
- **WHEN** fallback mode is enabled
- **THEN** the interface displays a persistent indicator that fallback mode is active
