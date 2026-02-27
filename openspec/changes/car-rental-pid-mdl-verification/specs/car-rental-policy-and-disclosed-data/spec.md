## ADDED Requirements

### Requirement: Policy result consumption
The system SHALL consume authorizer policy results and expose them as structured status outputs per booking verification.

#### Scenario: Display policy outcomes
- **WHEN** authorizer returns policy evaluation data
- **THEN** the system maps policy outcomes to structured status values and renders them in verification UI

### Requirement: Disclosed claim normalization
The system SHALL normalize disclosed PID and mDL claim data into a stable view model used by downstream screens.

#### Scenario: Normalize disclosed credential fields
- **WHEN** disclosed credential data is returned for a successful verification
- **THEN** the system maps required fields into normalized PID and mDL data objects

### Requirement: Graceful handling of optional claims
The system SHALL handle missing optional disclosed claims without breaking verification or confirmation rendering.

#### Scenario: Missing portrait claim
- **WHEN** portrait is absent in disclosed data and other required claims are present
- **THEN** the system continues flow and renders fallback UI for unavailable portrait
