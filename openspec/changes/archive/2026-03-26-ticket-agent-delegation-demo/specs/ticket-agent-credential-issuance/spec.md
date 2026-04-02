## Purpose

Server-side credential issuance service using `@vidos-id/openid4vc-issuer` to produce holder-bound `dc+sd-jwt` delegation credentials.

## ADDED Requirements

### Requirement: Issuer trust material generation at startup

The server SHALL generate issuer trust material at startup using `generateIssuerTrustMaterial()` from `@vidos-id/openid4vc-issuer`. The generated material SHALL include a signing key pair and JWKS. The server SHALL create a `DemoIssuer` instance configured with VCT `urn:vidos:agent-delegation:1` and the generated signing key. Trust material SHALL persist across requests for the lifetime of the server process.

#### Scenario: Issuer initialized on server start
- **WHEN** the server starts
- **THEN** issuer trust material SHALL be generated and a `DemoIssuer` instance SHALL be created with the delegation VCT

#### Scenario: JWKS available for verifier trust resolution
- **WHEN** the issuer is initialized
- **THEN** the issuer's public JWKS SHALL be available at the `/api/issuer/jwks` endpoint for verifier trust resolution

### Requirement: Delegation credential issuance with direct holder binding

The server SHALL issue `dc+sd-jwt` delegation credentials using the `@vidos-id/openid4vc-issuer` library's `issueCredential()` method with `holderPublicJwk` set to the agent's public key. The issuance flow SHALL: (1) create a pre-authorized grant with delegation claims derived from the verified PID and selected scopes, (2) exchange the pre-authorized code for an access token, (3) issue the credential with `holderPublicJwk` and without a proof JWT. The issued credential SHALL contain a `cnf` claim binding it to the agent's public key.

#### Scenario: Credential issued with agent's public key
- **WHEN** the delegation portal submits verified PID claims, an agent public JWK, and selected scopes
- **THEN** the server SHALL issue a `dc+sd-jwt` credential with the agent's public key embedded as the `cnf` claim

#### Scenario: Credential contains delegator identity from PID
- **WHEN** a delegation credential is issued
- **THEN** the credential claims SHALL include `given_name`, `family_name`, and `birth_date` derived from the verified PID

#### Scenario: Credential contains delegation metadata
- **WHEN** a delegation credential is issued
- **THEN** the credential claims SHALL include `delegation_scopes` (array of selected scope strings) and `valid_until` (ISO 8601 timestamp, default 30 days from issuance)

#### Scenario: All non-reserved claims are selectively disclosable
- **WHEN** a delegation credential is issued
- **THEN** all top-level claims except reserved SD-JWT claims (`iss`, `iat`, `vct`, `cnf`, `nbf`, `exp`, `status`) SHALL be selectively disclosable

### Requirement: Issuance endpoint

The server SHALL expose a `POST /api/delegation/issue` endpoint that accepts a delegation session ID, the agent's public JWK, and selected scopes. The endpoint SHALL validate that the delegation session exists and has status `verified` (PID verification completed). The endpoint SHALL issue the credential, store it in the delegation session, and return the compact `dc+sd-jwt` credential string in the response.

#### Scenario: Successful credential issuance
- **WHEN** a valid issuance request is submitted with a verified delegation session ID, a valid agent public JWK, and at least one scope
- **THEN** the server SHALL return the compact `dc+sd-jwt` credential string and update the delegation session status to `credential_issued`

#### Scenario: Issuance rejected for unverified session
- **WHEN** an issuance request references a delegation session that is not in `verified` status
- **THEN** the server SHALL return an error indicating PID verification must be completed first

#### Scenario: Issuance rejected for invalid public key
- **WHEN** an issuance request contains a public JWK that fails JWK schema validation
- **THEN** the server SHALL return a validation error
