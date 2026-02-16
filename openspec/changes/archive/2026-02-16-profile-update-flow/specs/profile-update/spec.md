# Profile Update

## ADDED Requirements

### Requirement: Field Selection UI
The system SHALL display an inline field selection interface on the profile page when user initiates profile update.

#### Scenario: Show field selection
- **WHEN** user clicks "Update Profile" button on profile page
- **THEN** system expands inline section showing checkboxes for updatable fields
- **THEN** checkboxes are labeled with human-readable field names (Family Name, Given Name, Date of Birth, Nationality, Email, Address, Portrait)

#### Scenario: Select fields
- **WHEN** user checks one or more field checkboxes
- **THEN** system tracks selected fields for credential request
- **THEN** "Continue" button becomes enabled

#### Scenario: Cancel field selection
- **WHEN** user clicks "Cancel" in field selection view
- **THEN** system collapses field selection section
- **THEN** profile page returns to normal view state

### Requirement: Profile Update Request
The system SHALL create a credential authorization request with only the user-selected fields.

#### Scenario: Create update request
- **WHEN** authenticated user submits field selection with at least one field selected
- **THEN** system creates Vidos authorization request with selected claim IDs only
- **THEN** system creates pending request record with type "profile_update"
- **THEN** system returns request ID and authorization details (QR URL or DC API request)

#### Scenario: Reject empty field selection
- **WHEN** user attempts to submit with no fields selected
- **THEN** system rejects request with validation error
- **THEN** user remains on field selection view

### Requirement: Profile Update Status Polling
The system SHALL support polling for profile update authorization status.

#### Scenario: Poll pending status
- **WHEN** client polls status for pending profile update request
- **THEN** system queries Vidos authorization status
- **THEN** system returns current status (pending, authorized, rejected, error, expired)

#### Scenario: Poll authorized status
- **WHEN** authorization completes successfully
- **THEN** system extracts claims from verified credential
- **THEN** system updates user record with received claim values
- **THEN** system deletes pending request
- **THEN** system returns success with updated field list

### Requirement: Profile Update DC API Completion
The system SHALL support DC API flow completion for profile updates.

#### Scenario: Complete via DC API
- **WHEN** client submits DC API response for profile update request
- **THEN** system forwards response to Vidos authorizer
- **THEN** system extracts claims from verified credential
- **THEN** system updates user record with received claim values
- **THEN** system deletes pending request
- **THEN** system returns success with updated field list

#### Scenario: Handle verification failure
- **WHEN** DC API verification fails
- **THEN** system returns error with failure details
- **THEN** pending request is preserved for retry

### Requirement: Partial Claim Handling
The system SHALL handle partial claim responses gracefully.

#### Scenario: Wallet returns subset of requested claims
- **WHEN** wallet returns fewer claims than requested (selective disclosure)
- **THEN** system updates only the fields for which claims were received
- **THEN** system returns list of actually updated fields to client

#### Scenario: Map claims to user fields
- **WHEN** claims are extracted from credential
- **THEN** system maps canonical claim IDs to user record fields:
  - family_name → familyName
  - given_name → givenName
  - birth_date → birthDate
  - nationality → nationality
  - email_address → email
  - resident_address → address
  - portrait → portrait

### Requirement: Client Cache Invalidation
The system SHALL invalidate stale profile data after successful update.

#### Scenario: Invalidate user cache
- **WHEN** profile update completes successfully
- **THEN** client invalidates React Query cache for ["user", "me"] query key
- **THEN** profile page refetches and displays updated data
