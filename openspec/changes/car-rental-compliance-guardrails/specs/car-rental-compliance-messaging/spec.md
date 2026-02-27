## ADDED Requirements

### Requirement: Allowed verification phrasing
The system SHALL use wording that describes displayed attributes as disclosed or presented wallet data.

#### Scenario: Render verification copy
- **WHEN** verification and confirmation copy is shown
- **THEN** wording uses disclosed/presented terminology for credential attributes

### Requirement: Source-attributed verification outcome phrasing
The system SHALL attribute verification outcomes to authorizer policy results.

#### Scenario: Render policy-attributed status
- **WHEN** verification status is shown to the user
- **THEN** the message attributes pass/fail outcome to authorizer policy result

### Requirement: Forbidden overclaim phrasing
The system SHALL NOT claim frontend-only cryptographic trust-chain verification or impossible retention guarantees.

#### Scenario: Prevent forbidden claim copy
- **WHEN** UI copy includes verification assurances
- **THEN** forbidden overclaim patterns are excluded from rendered messaging
