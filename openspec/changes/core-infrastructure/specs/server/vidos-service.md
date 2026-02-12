# Delta for Vidos Service Integration

## ADDED Requirements

### Requirement: Use Generated OpenAPI Client
The system SHALL use the openapi-fetch library with generated types from `@server/src/generated/authorizer-api.ts` for all Vidos API communication.

#### Scenario: Create singleton client instance
- **WHEN** vidos service is initialized
- **THEN** system creates a singleton openapi-fetch client with baseUrl from VIDOS_AUTHORIZER_URL
- **THEN** client includes Authorization header with Bearer token from VIDOS_API_KEY

#### Scenario: Reuse client across requests
- **WHEN** multiple authorization requests are made
- **THEN** system reuses the same client instance for all requests

### Requirement: Create Authorization Request using DCQL
The system SHALL create authorization requests via Vidos API using DCQL (DIF Credential Query Language) instead of Presentation Exchange.

#### Scenario: Create direct_post request with DCQL
- **WHEN** caller invokes createAuthorizationRequest with mode "direct_post" and requestedClaims
- **THEN** system sends POST to `/openid4/vp/v1_0/authorizations` with DCQL query
- **THEN** request body contains `{ query: { type: "DCQL", dcql: { purpose, credentials: [{ id: "pid", format: "dc+sd-jwt", claims: [...] }] } }, responseMode: "direct_post.jwt" }`
- **THEN** system returns discriminated union `{ mode: "direct_post", authorizationId, authorizeUrl }`

#### Scenario: Create dc_api request with DCQL
- **WHEN** caller invokes createAuthorizationRequest with mode "dc_api" and requestedClaims
- **THEN** system sends POST to `/openid4/vp/v1_0/authorizations` with DCQL query
- **THEN** request body contains `{ query: { type: "DCQL", dcql: { purpose, credentials: [...] } }, responseMode: "dc_api.jwt", protocol: "openid4vp-v1-unsigned" }`
- **THEN** system returns discriminated union `{ mode: "dc_api", authorizationId, dcApiRequest, responseUrl }`

#### Scenario: Build DCQL claims array
- **WHEN** requestedClaims is ["family_name", "given_name", "birth_date"]
- **THEN** DCQL query credentials[0].claims contains `[{ path: ["family_name"] }, { path: ["given_name"] }, { path: ["birth_date"] }]`

#### Scenario: Include purpose in DCQL query
- **WHEN** purpose is "Verify your identity for signup"
- **THEN** DCQL query contains `purpose: "Verify your identity for signup"`

#### Scenario: Vidos API returns error
- **WHEN** Vidos API responds with non-2xx status
- **THEN** system throws error with descriptive message from error response

### Requirement: Poll Authorization Status
The system SHALL poll Vidos API to retrieve authorization status.

#### Scenario: Poll pending authorization
- **WHEN** caller invokes pollAuthorizationStatus with authorization ID
- **THEN** system sends GET to `/openid4/vp/v1_0/authorizations/{authorizationId}/status`
- **THEN** system returns mapped status ("created" maps to "pending")

#### Scenario: Poll authorized request
- **WHEN** Vidos returns status "authorized"
- **THEN** system returns status "authorized"

#### Scenario: Poll rejected authorization
- **WHEN** Vidos returns status "rejected"
- **THEN** system returns status "rejected"

#### Scenario: Poll expired authorization
- **WHEN** Vidos returns status "expired"
- **THEN** system returns status "expired"

#### Scenario: Authorization not found
- **WHEN** Vidos returns 404
- **THEN** system throws error "Authorization not found"

### Requirement: Forward DC API Response
The system SHALL forward VP token responses from Digital Credentials API to Vidos API.

#### Scenario: Forward JWT response format
- **WHEN** caller invokes forwardDCAPIResponse with dcResponse containing `{ response: string }`
- **THEN** system sends POST to `/openid4/vp/v1_0/{authorizationId}/dc_api.jwt`
- **THEN** request body contains `{ origin, digitalCredentialGetResponse: { response } }`
- **THEN** system returns status from response

#### Scenario: Forward vp_token response format
- **WHEN** caller invokes forwardDCAPIResponse with dcResponse containing `{ vp_token: object }`
- **THEN** system sends POST to `/openid4/vp/v1_0/{authorizationId}/dc_api`
- **THEN** request body contains `{ origin, digitalCredentialGetResponse: { vp_token } }`
- **THEN** system returns status from response

### Requirement: Retrieve Extracted Credentials
The system SHALL retrieve normalized claims from completed authorizations via Vidos credentials endpoint.

#### Scenario: Get credentials for authorized request
- **WHEN** caller invokes getExtractedCredentials with authorization ID
- **THEN** system sends GET to `/openid4/vp/v1_0/authorizations/{authorizationId}/credentials`
- **THEN** system extracts claims from first credential in response

#### Scenario: Normalize snake_case to camelCase
- **WHEN** credential contains family_name, given_name, birth_date
- **THEN** system returns claims with familyName, givenName, birthDate

#### Scenario: Handle identifier field
- **WHEN** credential contains personal_administrative_number
- **THEN** system sets identifier to personal_administrative_number value
- **WHEN** credential contains document_number but no personal_administrative_number
- **THEN** system sets identifier to document_number value

#### Scenario: Validate required claims
- **WHEN** required claims are missing from credential
- **THEN** system throws error with details about missing claims

#### Scenario: No credentials found
- **WHEN** credentials array is empty
- **THEN** system throws error "No credentials found in authorization"

### Requirement: Use Environment Configuration
The system SHALL read Vidos API configuration from validated environment.

#### Scenario: Construct API endpoint URL
- **WHEN** making Vidos API call
- **THEN** system uses VIDOS_AUTHORIZER_URL from env as client baseUrl

#### Scenario: Include authorization header
- **WHEN** making Vidos API call
- **THEN** client includes "Authorization: Bearer {VIDOS_API_KEY}" header
