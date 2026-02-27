## ADDED Requirements

### Requirement: Required credential highlight fields
The system SHALL render credential highlights in confirmation using disclosed data, including full name, mDL number, mDL expiry, and driving privileges when present.

#### Scenario: Render credential highlights
- **WHEN** disclosed data is available at confirmation stage
- **THEN** the system displays required identity and driving highlight fields

### Requirement: Portrait highlight support
The system SHALL display portrait/photo in confirmation highlights when provided by disclosed credential data.

#### Scenario: Display portrait when available
- **WHEN** disclosed portrait data exists
- **THEN** confirmation highlights include the portrait/photo component

### Requirement: Fallback rendering for missing highlights
The system SHALL provide fallback presentation for unavailable optional highlight fields.

#### Scenario: Missing optional highlight field
- **WHEN** an optional credential highlight value is absent
- **THEN** the system renders fallback text and preserves layout integrity
