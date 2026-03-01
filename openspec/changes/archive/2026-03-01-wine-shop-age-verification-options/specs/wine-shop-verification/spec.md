## MODIFIED Requirements

### Requirement: PID credential request via DCQL

The system SHALL build a DCQL query requesting a PID credential. The claims requested SHALL depend on the selected `AgeVerificationMethod`:
- `age_equal_or_over`: request only `["age_equal_or_over", "<requiredAge>"]`
- `age_in_years`: request only `["age_in_years"]`
- `birthdate`: request only `["birthdate"]`

The credential entry `id` SHALL remain `age-<requiredAge>-pid-cred` for all methods. The system SHALL generate a unique cryptographic nonce per authorization request. The credential format SHALL be `dc+sd-jwt` (SD-JWT VC).

#### Scenario: DCQL query with age_equal_or_over method
- **WHEN** the selected method is `age_equal_or_over` and `requiredAge` is `18`
- **THEN** the DCQL credential claims array contains exactly `[{ path: ["age_equal_or_over", "18"] }]`

#### Scenario: DCQL query with age_in_years method
- **WHEN** the selected method is `age_in_years`
- **THEN** the DCQL credential claims array contains exactly `[{ path: ["age_in_years"] }]`

#### Scenario: DCQL query with birthdate method
- **WHEN** the selected method is `birthdate`
- **THEN** the DCQL credential claims array contains exactly `[{ path: ["birthdate"] }]`

#### Scenario: Nonce uniqueness
- **WHEN** a new authorization session is created
- **THEN** the nonce SHALL be cryptographically random and unique to that session

### Requirement: Verification session initiation with method

The system SHALL accept `ageVerificationMethod: AgeVerificationMethod` as an input to `startVerification` alongside `orderId` and `shippingDestination`. The method SHALL be forwarded to `createAuthorizerAuthorization` and used when building the DCQL query.

#### Scenario: Method forwarded to authorizer client
- **WHEN** `startVerification` is called with `ageVerificationMethod: "age_in_years"`
- **THEN** `createAuthorizerAuthorization` is called with `ageVerificationMethod: "age_in_years"` and the resulting DCQL requests only `age_in_years`

### Requirement: Age eligibility check

The system SHALL compute age eligibility from the disclosed claims regardless of which method was used. The priority order for claim resolution SHALL be:
1. `ageEqualOrOver[requiredAge]` (boolean) — if present, use directly
2. `ageInYears` (number) — compare against `requiredAge`
3. `birthDate` (ISO date string) — compute age and compare against `requiredAge`

If none of these claims are present, `eligible` SHALL be `false`.

The result SHALL be an `AgeCheckResult` containing: `eligible` (boolean), `requiredAge` (number), `actualAge` (number or null), `birthDate` (string or null), `destination` (string).

#### Scenario: Eligibility from age_equal_or_over boolean — passes
- **WHEN** `ageEqualOrOver["18"]` is `true` and `requiredAge` is `18`
- **THEN** `eligible` is `true`

#### Scenario: Eligibility from age_equal_or_over boolean — fails
- **WHEN** `ageEqualOrOver["18"]` is `false` and `requiredAge` is `18`
- **THEN** `eligible` is `false`

#### Scenario: Eligibility from age_in_years — passes
- **WHEN** `ageInYears` is `25` and `requiredAge` is `21`
- **THEN** `eligible` is `true` and `actualAge` is `25`

#### Scenario: Eligibility from age_in_years — fails
- **WHEN** `ageInYears` is `17` and `requiredAge` is `18`
- **THEN** `eligible` is `false` and `actualAge` is `17`

#### Scenario: Eligibility from birthdate — buyer meets EU threshold (18+)
- **WHEN** the disclosed `birthDate` indicates the buyer is 18 or older and `requiredAge` is `18`
- **THEN** `eligible` is `true`

#### Scenario: Eligibility from birthdate — buyer meets EU but not US threshold
- **WHEN** `birthDate` indicates age 19 and `requiredAge` is `21`
- **THEN** `eligible` is `false`

#### Scenario: Eligibility from birthdate — buyer meets US threshold (21+)
- **WHEN** `birthDate` indicates age 22 and `requiredAge` is `21`
- **THEN** `eligible` is `true`

#### Scenario: No qualifying claim present
- **WHEN** the disclosed claims contain none of `ageEqualOrOver`, `ageInYears`, or `birthDate`
- **THEN** `eligible` is `false` and `actualAge` is `null`
