## ADDED Requirements

### Requirement: Nonce per authorization request
The system SHALL generate a new cryptographic nonce for each verification authorization request.

#### Scenario: Create fresh nonce
- **WHEN** a new verification request is initiated
- **THEN** the request contains a newly generated nonce not reused from prior requests

### Requirement: Request-response correlation integrity
The system SHALL preserve and validate request-response correlation for each booking-linked authorization flow.

#### Scenario: Validate correlated response
- **WHEN** authorization result is received
- **THEN** the system accepts the result only if correlation metadata matches the active booking context

### Requirement: mDL identifier semantics
The system SHALL represent mDL query semantics using document type `org.iso.18013.5.1.mDL` and namespace `org.iso.18013.5.1` where applicable.

#### Scenario: Build mDL query identifiers
- **WHEN** the verifier request includes mDL requirements
- **THEN** mDL query representation uses the required document type and namespace semantics

### Requirement: DCQL credential mapping integrity
The system SHALL preserve deterministic mapping from requested DCQL credential IDs to parsed response data structures.

#### Scenario: Map credential response by ID
- **WHEN** multi-credential response data is parsed
- **THEN** each parsed credential object is associated with the originating DCQL credential ID
