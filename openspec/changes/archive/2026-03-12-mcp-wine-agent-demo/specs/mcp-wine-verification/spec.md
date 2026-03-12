## Purpose

Vidos authorization creation, QR-ready verification payloads, internal authorization monitoring, and age eligibility evaluation from PID claims.

## ADDED Requirements

### Requirement: Age-over-18 credential request via DCQL for SD-JWT

The system SHALL build a DCQL query requesting a PID credential in `dc+sd-jwt` format. The credential request SHALL target `urn:eudi:pid:1`, use `require_cryptographic_holder_binding: true`, and request only the `age_equal_or_over.18` proof. Nonce handling SHALL rely on the default behavior provided by Vidos.

#### Scenario: DCQL query built for wine checkout
- **WHEN** checkout enters the verification-required step
- **THEN** the system builds a DCQL query with a single PID credential entry using `dc+sd-jwt`, `urn:eudi:pid:1`, holder binding, and the `age_equal_or_over.18` claim path

### Requirement: Authorizer session creation and QR payload

The system SHALL create an authorization session via the Vidos Authorizer REST API (`POST /openid4/vp/v1_0/authorizations`) and store the resulting authorization state with the checkout session. The system SHALL return a QR-ready authorization URL, QR SVG data, and enough metadata for a minimal ChatGPT widget to display the QR code.

#### Scenario: Verification session created
- **WHEN** checkout requires PID verification
- **THEN** the system creates a Vidos authorization session and returns the authorization identifier, current state, and QR-ready authorization URL

#### Scenario: Verification widget can render QR code
- **WHEN** the authorization session is created successfully
- **THEN** the system returns metadata and QR SVG data sufficient for a minimal UI resource to render the QR code for wallet scanning

### Requirement: Server-driven authorization monitoring

The system SHALL internally poll the Vidos status endpoint on a fixed cadence while an authorization remains non-terminal. The server SHALL process terminal states by fetching policy response and disclosed credentials on success, or storing error details on rejection, expiration, or failure.

#### Scenario: Internal monitor processes success
- **WHEN** Vidos reports a terminal authorized state
- **THEN** the server fetches policy response and disclosed credentials, evaluates the age-over-18 claim, and stores the processed verification outcome

#### Scenario: Internal monitor processes failure
- **WHEN** Vidos reports `rejected`, `expired`, or `error`
- **THEN** the server stores the terminal verification state and any available error details for later retrieval

### Requirement: Verification status lookup for agent reporting

The system SHALL expose an MCP tool that returns the latest processed verification state for a checkout session. The response SHALL include checkout-oriented status, lower-level authorization status for demo transparency, and agent-readable guidance for what to say next.

#### Scenario: Verification still pending
- **WHEN** the agent requests verification status before the server reaches a terminal state
- **THEN** the system returns a pending state with the latest authorization status and guidance that verification is still in progress

#### Scenario: Verification completed successfully
- **WHEN** the agent requests verification status after the server processed a successful authorization
- **THEN** the system returns a success state with age-check details and guidance that the user can proceed

#### Scenario: Verification status supports widget-driven continuation
- **WHEN** the mounted ChatGPT widget requests verification status while the server monitor is processing authorization updates
- **THEN** the system returns the same authoritative checkout snapshot needed for compact UI refresh and later agent continuation

### Requirement: Age eligibility evaluation

The system SHALL evaluate the buyer's eligibility against the wine purchase threshold of 18 years using the disclosed `age_equal_or_over.18` claim when available. The result SHALL contain `eligible`, `requiredAge`, `actualAge`, and `birthDate`, with `actualAge` and `birthDate` allowed to remain `null` when only the threshold proof is disclosed.

#### Scenario: Buyer meets age threshold
- **WHEN** the disclosed `age_equal_or_over.18` proof indicates the buyer is 18 or older
- **THEN** the computed age-check result marks the buyer as eligible

#### Scenario: Buyer fails age threshold
- **WHEN** the disclosed `age_equal_or_over.18` proof is missing or false and no stronger age evidence is available
- **THEN** the computed age-check result marks the buyer as ineligible and purchase cannot complete

### Requirement: Minimal PID disclosure handling

The system SHALL handle the raw Vidos credential response with a minimal SD-JWT PID-focused extraction path. The implementation SHALL support `age_equal_or_over.18`, and MAY preserve any additional disclosed PID fields without requiring a complex normalization layer.

#### Scenario: Age-over-18 claim disclosed
- **WHEN** the wallet discloses the requested `age_equal_or_over.18` proof
- **THEN** the verification flow completes without requiring full identity fields

#### Scenario: Additional PID fields absent
- **WHEN** the wallet does not disclose identity fields such as `birth_date`, `given_name`, or `portrait`
- **THEN** the verification flow still completes normally as long as the required age-over-18 proof is available
