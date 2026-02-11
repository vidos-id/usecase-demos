# Signin API Specifications

## ADDED Requirements

### Requirement: Create signin authorization request
The system SHALL create a Vidos authorization request for user signin with minimal PID attributes.

#### Scenario: Successful request creation with direct_post mode
- **WHEN** client sends POST /api/signin/request with `{ mode: "direct_post" }`
- **THEN** server creates authorization with Vidos API requesting personal_administrative_number (preferred), document_number (fallback), family_name, given_name
- **THEN** server returns `{ requestId, authorizationId, authorizeUrl }`
- **THEN** requestId is stored in pendingRequests map with associated authorizationId and mode

#### Scenario: Successful request creation with dc_api mode
- **WHEN** client sends POST /api/signin/request with `{ mode: "dc_api" }`
- **THEN** server creates authorization with Vidos API for dc_api presentation mode
- **THEN** server returns `{ requestId, authorizationId, dcApiRequest, responseUrl }`
- **THEN** dcApiRequest contains Digital Credentials API request object
- **THEN** requestId is stored in pendingRequests map

#### Scenario: Invalid mode value
- **WHEN** client sends POST /api/signin/request with invalid mode value
- **THEN** server returns 400 Bad Request with Zod validation error

### Requirement: Poll signin verification status
The system SHALL allow clients to poll the status of a pending signin authorization request.

#### Scenario: Authorization pending
- **WHEN** client sends GET /api/signin/status/:requestId for pending authorization
- **THEN** server polls Vidos API with stored authorizationId
- **THEN** server returns `{ status: "pending" }` if wallet has not yet posted response

#### Scenario: Authorization completed with existing user
- **WHEN** client sends GET /api/signin/status/:requestId for completed authorization
- **THEN** server polls Vidos API and receives authorized status
- **THEN** server fetches verified credentials from Vidos API
- **THEN** server matches user by personalAdministrativeNumber or documentNumber
- **THEN** server creates session with stored mode preference
- **THEN** server returns `{ status: "authorized", sessionId, user, mode }`

#### Scenario: Authorization completed with no matching user
- **WHEN** client sends GET /api/signin/status/:requestId for completed authorization
- **THEN** server polls Vidos API and receives authorized status
- **THEN** server attempts to match user by identifier
- **THEN** server finds no matching user
- **THEN** server returns `{ status: "error" }` (user must poll again or handle via complete endpoint)

#### Scenario: Authorization rejected
- **WHEN** client sends GET /api/signin/status/:requestId for rejected authorization
- **THEN** server returns `{ status: "rejected" }` if user declined in wallet

#### Scenario: Authorization expired
- **WHEN** client sends GET /api/signin/status/:requestId for expired authorization
- **THEN** server returns `{ status: "expired" }` if Vidos authorization expired

#### Scenario: Invalid requestId
- **WHEN** client sends GET /api/signin/status/:requestId with unknown requestId
- **THEN** server returns 404 Not Found

### Requirement: Complete signin with DC API response
The system SHALL complete signin by processing Digital Credentials API response from client.

#### Scenario: Successful DC API completion with existing user
- **WHEN** client sends POST /api/signin/complete/:requestId with `{ dcResponse }`
- **THEN** server extracts verified claims from dcResponse
- **THEN** server matches user by personalAdministrativeNumber or documentNumber
- **THEN** server creates session with dc_api mode
- **THEN** server returns `{ sessionId, user, mode }`
- **THEN** server removes requestId from pendingRequests

#### Scenario: DC API completion with no matching user
- **WHEN** client sends POST /api/signin/complete/:requestId with `{ dcResponse }`
- **THEN** server extracts verified claims from dcResponse
- **THEN** server finds no user matching personalAdministrativeNumber or documentNumber
- **THEN** server returns 404 Not Found with error `{ error: "No account found with this identity. Please sign up first." }`

#### Scenario: Invalid dcResponse format
- **WHEN** client sends POST /api/signin/complete/:requestId with malformed dcResponse
- **THEN** server returns 400 Bad Request with validation error

#### Scenario: Completion for direct_post mode request
- **WHEN** client sends POST /api/signin/complete/:requestId for direct_post mode
- **THEN** server returns 400 Bad Request (completion endpoint is dc_api only)

### Requirement: Request expiration
The system SHALL expire pending signin requests after timeout period.

#### Scenario: Request cleanup after timeout
- **WHEN** pending request exceeds 10 minute TTL
- **THEN** server removes requestId from pendingRequests map
- **THEN** subsequent status polls return 404 Not Found
