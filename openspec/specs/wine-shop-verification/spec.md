## Purpose

PID credential verification via Vidos Authorizer with age check logic.

## ADDED Requirements

### Requirement: PID credential request via DCQL

The system SHALL build a DCQL query requesting a PID credential. The query SHALL request the following claims: `given_name` (required), `family_name` (required), `birth_date` (required), `portrait` (optional). The system SHALL generate a unique cryptographic nonce per authorization request. The credential format SHALL be `dc+sd-jwt` (SD-JWT VC).

#### Scenario: DCQL query built for checkout
- **WHEN** the user enters the verification step
- **THEN** the system builds a DCQL query with a single PID credential entry containing the specified claims and a fresh nonce

#### Scenario: Nonce uniqueness
- **WHEN** a new authorization session is created
- **THEN** the nonce SHALL be cryptographically random and unique to that session

### Requirement: Authorizer session integration

The system SHALL create an authorization session via the Vidos Authorizer REST API (`POST /openid4/vp/v1_0/authorizations`), display a QR code from the authorization URL, poll for status, and retrieve policy response and disclosed claims on completion. The `authorizerId` SHALL be correlated with the `orderId`.

#### Scenario: QR code displayed
- **WHEN** the authorization session is created successfully
- **THEN** the system displays a QR code encoding the authorization URL for wallet scanning

#### Scenario: Status polling
- **WHEN** the authorization session is in `pending_wallet` or `processing` state
- **THEN** the system polls the authorizer status endpoint at regular intervals (≤2s)

#### Scenario: Successful credential retrieval
- **WHEN** the authorizer status transitions to a completed state
- **THEN** the system retrieves the policy response and disclosed claims from the authorizer

#### Scenario: Authorizer error handling
- **WHEN** the authorizer returns an error or the session expires
- **THEN** the system displays the error state and offers a retry option

### Requirement: Verification lifecycle state machine

The verification SHALL follow a state machine: `created → pending_wallet → processing → success | rejected | expired | error`. Recovery SHALL be allowed from `rejected`, `expired`, and `error` states back to `created`. The UI SHALL reflect the current lifecycle state with appropriate messaging and visual indicators.

#### Scenario: Happy path lifecycle
- **WHEN** a user scans the QR code and presents valid PID credentials
- **THEN** the lifecycle transitions: `created → pending_wallet → processing → success`

#### Scenario: Recovery from failure
- **WHEN** the verification is in `rejected`, `expired`, or `error` state
- **THEN** the user can trigger a retry which transitions back to `created` with a new session

### Requirement: Age eligibility check

The system SHALL compute the buyer's age from the disclosed `birth_date` claim and compare it against the selected shipping destination's `legalDrinkingAge`. The result SHALL be an `AgeCheckResult` containing: `eligible` (boolean), `requiredAge` (number), `actualAge` (number or null), `birthDate` (string or null), `destination` (string — the shipping destination label). If the buyer's age is below the required age, `eligible` SHALL be `false`.

#### Scenario: Buyer meets EU threshold (18+)
- **WHEN** the disclosed `birth_date` indicates the buyer is 18 or older
- **AND** the selected shipping destination is EU (legalDrinkingAge: 18)
- **THEN** `eligible` is `true` and the buyer can proceed to payment

#### Scenario: Buyer meets EU but not US threshold (age 19, shipping to US)
- **WHEN** the disclosed `birth_date` indicates the buyer is 19
- **AND** the selected shipping destination is US (legalDrinkingAge: 21)
- **THEN** `eligible` is `false` and the system blocks progression to payment

#### Scenario: Buyer meets US threshold (21+)
- **WHEN** the disclosed `birth_date` indicates the buyer is 21 or older
- **AND** the selected shipping destination is US (legalDrinkingAge: 21)
- **THEN** `eligible` is `true` and the buyer can proceed to payment

#### Scenario: Missing birth_date claim
- **WHEN** the `birth_date` claim is not present in disclosed claims
- **THEN** `eligible` is `false` and `actualAge` is `null`

### Requirement: Disclosed claims normalization

The system SHALL normalize the raw authorizer credential response into a stable domain model for UI consumption. The normalized model SHALL include: `givenName`, `familyName`, `birthDate`, `portrait` (base64 string or null). Missing optional claims SHALL be handled gracefully (null values, no UI crashes).

#### Scenario: Full claims disclosed
- **WHEN** the wallet discloses all requested PID claims
- **THEN** the normalized model contains all fields populated

#### Scenario: Portrait not disclosed
- **WHEN** the wallet does not disclose the `portrait` claim
- **THEN** the normalized model has `portrait: null` and the UI omits the photo section without error
