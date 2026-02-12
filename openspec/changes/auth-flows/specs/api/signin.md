# Signin API Specifications

## ADDED Requirements

### Requirement: Create signin authorization request
The system SHALL create a Vidos authorization request for user signin with minimal PID claims using DCQL.

#### Scenario: Successful request creation with direct_post mode
- **WHEN** client sends POST /api/signin/request with `{ mode: "direct_post" }`
- **THEN** server creates DCQL authorization with Vidos API requesting claims: personal_administrative_number
- **THEN** server returns discriminated union response `{ mode: "direct_post", requestId, authorizeUrl }`
- **THEN** requestId is stored in pendingRequests map with associated authorizationId and mode

#### Scenario: Successful request creation with dc_api mode
- **WHEN** client sends POST /api/signin/request with `{ mode: "dc_api" }`
- **THEN** server creates DCQL authorization with Vidos API for dc_api presentation mode
- **THEN** server returns discriminated union response `{ mode: "dc_api", requestId, dcApiRequest }`
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
- **THEN** server fetches verified credentials from Vidos API /credentials endpoint with signinClaimsSchema
- **THEN** server matches user by personal_administrative_number
- **THEN** server creates session with stored mode preference
- **THEN** server deletes pending request from map
- **THEN** server returns `{ status: "authorized", sessionId, user, mode }`

#### Scenario: Authorization completed with no matching user
- **WHEN** client sends GET /api/signin/status/:requestId for completed authorization
- **THEN** server polls Vidos API and receives authorized status
- **THEN** server attempts to match user by identifier
- **THEN** server finds no matching user
- **THEN** server returns `{ status: "error", error: "No account found..." }`

#### Scenario: Authorization rejected
- **WHEN** client sends GET /api/signin/status/:requestId for rejected authorization
- **THEN** server returns `{ status: "rejected" }` if user declined in wallet

#### Scenario: Authorization expired
- **WHEN** client sends GET /api/signin/status/:requestId for expired authorization
- **THEN** server returns `{ status: "expired" }` if Vidos authorization expired

#### Scenario: Unknown requestId
- **WHEN** client sends GET /api/signin/status/:requestId with unknown requestId
- **THEN** server returns 404 Not Found with error message

### Requirement: Complete signin with DC API response
The system SHALL complete signin by processing Digital Credentials API response from client.

#### Scenario: Successful DC API completion with existing user
- **WHEN** client sends POST /api/signin/complete/:requestId with `{ origin, dcResponse }`
- **THEN** server forwards dcResponse to Vidos API dc_api.jwt endpoint
- **THEN** server fetches verified credentials from Vidos API /credentials endpoint with signinClaimsSchema
- **THEN** server matches user by personal_administrative_number
- **THEN** server creates session with dc_api mode
- **THEN** server deletes pending request from map
- **THEN** server returns `{ sessionId, user, mode }`

#### Scenario: DC API completion with no matching user
- **WHEN** client sends POST /api/signin/complete/:requestId with `{ dcResponse }`
- **THEN** server extracts verified claims
- **THEN** server finds no user matching identifier
- **THEN** server returns 404 Not Found with error `{ error: "No account found with this identity. Please sign up first." }`

#### Scenario: Invalid dcResponse format
- **WHEN** client sends POST /api/signin/complete/:requestId with malformed dcResponse
- **THEN** server returns 400 Bad Request with validation error

### Requirement: Request expiration
The system SHALL expire pending signin requests after timeout period.

#### Scenario: Request cleanup after timeout
- **WHEN** pending request exceeds 10 minute TTL
- **THEN** server removes requestId from pendingRequests map
- **THEN** subsequent status polls return 404 Not Found
