# Signup API Specifications

## ADDED Requirements

### Requirement: Create signup authorization request
The system SHALL create a Vidos authorization request for user signup with full PID attributes.

#### Scenario: Successful request creation with direct_post mode
- **WHEN** client sends POST /api/signup/request with `{ mode: "direct_post" }`
- **THEN** server creates authorization with Vidos API requesting family_name, given_name, birth_date, birth_place, nationality, resident_address (or structured address fields), portrait (optional), personal_administrative_number (optional), document_number (optional)
- **THEN** server returns `{ requestId, authorizationId, authorizeUrl }`
- **THEN** requestId is stored in pendingRequests map with associated authorizationId and mode

#### Scenario: Successful request creation with dc_api mode
- **WHEN** client sends POST /api/signup/request with `{ mode: "dc_api" }`
- **THEN** server creates authorization with Vidos API for dc_api presentation mode
- **THEN** server returns `{ requestId, authorizationId, dcApiRequest, responseUrl }`
- **THEN** dcApiRequest contains Digital Credentials API request object
- **THEN** requestId is stored in pendingRequests map

#### Scenario: Invalid mode value
- **WHEN** client sends POST /api/signup/request with invalid mode value
- **THEN** server returns 400 Bad Request with Zod validation error

### Requirement: Poll signup verification status
The system SHALL allow clients to poll the status of a pending signup authorization request.

#### Scenario: Authorization pending
- **WHEN** client sends GET /api/signup/status/:requestId for pending authorization
- **THEN** server polls Vidos API with stored authorizationId
- **THEN** server returns `{ status: "pending" }` if wallet has not yet posted response

#### Scenario: Authorization completed
- **WHEN** client sends GET /api/signup/status/:requestId for completed authorization
- **THEN** server polls Vidos API and receives authorized status
- **THEN** server fetches verified credentials from Vidos API
- **THEN** server creates new user with extracted PID claims (familyName, givenName, birthDate, etc.)
- **THEN** server creates session with stored mode preference
- **THEN** server returns `{ status: "authorized", sessionId, user, mode }`

#### Scenario: Authorization rejected
- **WHEN** client sends GET /api/signup/status/:requestId for rejected authorization
- **THEN** server returns `{ status: "rejected" }` if user declined in wallet

#### Scenario: Authorization expired
- **WHEN** client sends GET /api/signup/status/:requestId for expired authorization
- **THEN** server returns `{ status: "expired" }` if Vidos authorization expired

#### Scenario: Invalid requestId
- **WHEN** client sends GET /api/signup/status/:requestId with unknown requestId
- **THEN** server returns 404 Not Found

### Requirement: Complete signup with DC API response
The system SHALL complete signup by processing Digital Credentials API response from client.

#### Scenario: Successful DC API completion
- **WHEN** client sends POST /api/signup/complete/:requestId with `{ dcResponse }`
- **THEN** server extracts verified claims from dcResponse
- **THEN** server creates new user with extracted PID claims
- **THEN** server creates session with dc_api mode
- **THEN** server returns `{ sessionId, user, mode }`
- **THEN** server removes requestId from pendingRequests

#### Scenario: Invalid dcResponse format
- **WHEN** client sends POST /api/signup/complete/:requestId with malformed dcResponse
- **THEN** server returns 400 Bad Request with validation error

#### Scenario: Completion for direct_post mode request
- **WHEN** client sends POST /api/signup/complete/:requestId for direct_post mode
- **THEN** server returns 400 Bad Request (completion endpoint is dc_api only)

#### Scenario: Missing required PID claims
- **WHEN** client sends POST /api/signup/complete/:requestId with dcResponse missing required claims
- **THEN** server returns 400 Bad Request with error describing missing claims

### Requirement: Request expiration
The system SHALL expire pending signup requests after timeout period.

#### Scenario: Request cleanup after timeout
- **WHEN** pending request exceeds 10 minute TTL
- **THEN** server removes requestId from pendingRequests map
- **THEN** subsequent status polls return 404 Not Found
