# Signup API Specifications

## ADDED Requirements

### Requirement: Create signup authorization request
The system SHALL create a Vidos authorization request for user signup with full PID claims using DCQL.

#### Scenario: Successful request creation with direct_post mode
- **WHEN** client sends POST /api/signup/request with `{ mode: "direct_post" }`
- **THEN** server creates DCQL authorization with Vidos API requesting claims: personal_administrative_number, family_name, given_name, birthdate, place_of_birth, nationalities, document_number, picture
- **THEN** server returns discriminated union response `{ mode: "direct_post", requestId, authorizationId, authorizeUrl }`
- **THEN** requestId is stored in pendingRequests map with associated authorizationId and mode

#### Scenario: Successful request creation with dc_api mode
- **WHEN** client sends POST /api/signup/request with `{ mode: "dc_api" }`
- **THEN** server creates DCQL authorization with Vidos API for dc_api presentation mode
- **THEN** server returns discriminated union response `{ mode: "dc_api", requestId, authorizationId, dcApiRequest, responseUrl }`
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
- **THEN** server fetches verified credentials from Vidos API /credentials endpoint with signupClaimsSchema
- **THEN** server creates new user with identifier=personal_administrative_number, documentNumber (optional), family_name, given_name, birthdate, nationalities (flattened to string), place_of_birth (flattened to string), picture
- **THEN** server creates session with stored mode preference
- **THEN** server deletes pending request from map
- **THEN** server returns `{ status: "authorized", sessionId, user, mode }`

#### Scenario: Authorization rejected
- **WHEN** client sends GET /api/signup/status/:requestId for rejected authorization
- **THEN** server returns `{ status: "rejected" }` if user declined in wallet

#### Scenario: Authorization expired
- **WHEN** client sends GET /api/signup/status/:requestId for expired authorization
- **THEN** server returns `{ status: "expired" }` if Vidos authorization expired

#### Scenario: Unknown requestId
- **WHEN** client sends GET /api/signup/status/:requestId with unknown requestId
- **THEN** server returns 404 Not Found with error message

### Requirement: Complete signup with DC API response
The system SHALL complete signup by processing Digital Credentials API response from client.

#### Scenario: Successful DC API completion
- **WHEN** client sends POST /api/signup/complete/:requestId with `{ origin, dcResponse }`
- **THEN** server forwards dcResponse to Vidos API dc_api.jwt endpoint
- **THEN** server fetches verified credentials from Vidos API /credentials endpoint with signupClaimsSchema
- **THEN** server creates new user with identifier=personal_administrative_number and other claims
- **THEN** server creates session with dc_api mode
- **THEN** server deletes pending request from map
- **THEN** server returns `{ sessionId, user, mode }`

#### Scenario: Invalid dcResponse format
- **WHEN** client sends POST /api/signup/complete/:requestId with malformed dcResponse
- **THEN** server returns 400 Bad Request with validation error

#### Scenario: Missing required PID claims
- **WHEN** Vidos credentials response missing required claims
- **THEN** server returns 400 Bad Request with error describing missing claims

### Requirement: Request expiration
The system SHALL expire pending signup requests after timeout period.

#### Scenario: Request cleanup after timeout
- **WHEN** pending request exceeds 10 minute TTL
- **THEN** server removes requestId from pendingRequests map
- **THEN** subsequent status polls return 404 Not Found

### Requirement: Redirect to profile after signup
The system SHALL redirect users to the profile page after successful signup.

#### Scenario: Successful signup redirect
- **WHEN** signup completes successfully (via polling or DC API completion)
- **THEN** client redirects user to /profile page
