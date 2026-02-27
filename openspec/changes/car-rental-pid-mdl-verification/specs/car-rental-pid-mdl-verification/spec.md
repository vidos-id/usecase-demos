## ADDED Requirements

### Requirement: Dual credential verification request
The system SHALL create one verifier request that includes both PID and mDL credential requirements represented through DCQL.

#### Scenario: Create PID and mDL request together
- **WHEN** a user starts verification from a valid booking context
- **THEN** the system creates a single request containing credential query entries for PID and mDL

### Requirement: Verification lifecycle states
The system SHALL represent verification lifecycle states as created, pending_wallet, processing, success, rejected, expired, or error.

#### Scenario: Render lifecycle progression
- **WHEN** verification progresses across request creation and result retrieval
- **THEN** the system updates and displays the current lifecycle state consistently

### Requirement: Verification gating
The system SHALL allow progression to payment only when verification lifecycle status is success, except in explicit fallback mode.

#### Scenario: Block payment on failed verification
- **WHEN** verification status is rejected, expired, or error
- **THEN** the system does not allow progression to payment and provides a retry or restart path
