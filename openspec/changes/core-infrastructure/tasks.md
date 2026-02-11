## 1. Data Models and Type Definitions

- [x] 1.1 Create User type interface with id, identifier, familyName, givenName, birthDate, nationality, createdAt, and optional address/portrait
- [x] 1.2 Create Session type interface with id, userId, mode, createdAt, and expiresAt
- [x] 1.3 Create PendingAuthRequest type with id, vidosAuthorizationId, type, mode, status, responseUrl?, metadata?, result?, createdAt, completedAt?
- [x] 1.4 Create ExtractedClaims type in shared package for normalized claim structure

## 2. In-Memory Stores

- [x] 2.1 Implement users store with Map-based singleton in server/src/stores/users.ts
- [x] 2.2 Add createUser, getUserById, getUserByIdentifier, and listUsers functions to users store
- [x] 2.3 Implement sessions store with Map-based singleton in server/src/stores/sessions.ts
- [x] 2.4 Add createSession, getSessionById, getSessionsByUserId, and deleteSession functions to sessions store
- [x] 2.5 Implement session expiration check logic in getSessionById
- [x] 2.6 Implement pendingAuthRequests store with Map-based singleton in server/src/stores/pendingAuthRequests.ts
- [x] 2.7 Add createPendingRequest, getPendingRequestByAuthId, getPendingRequestByIdentifier functions to pendingAuthRequests store
- [x] 2.8 Add updateRequestToCompleted, updateRequestToFailed, updateRequestToExpired, and listPendingRequests functions to pendingAuthRequests store

## 3. Environment Configuration

- [x] 3.1 Create server/src/env.ts with Zod schema for VIDOS_AUTHORIZER_URL and VIDOS_API_KEY
- [x] 3.2 Add URL validation for VIDOS_AUTHORIZER_URL using z.string().url()
- [x] 3.3 Add non-empty string validation for VIDOS_API_KEY using z.string().min(1)
- [x] 3.4 Export validated env object with TypeScript type inference
- [x] 3.5 Ensure env validation runs at module import time for fail-fast behavior

## 4. Vidos Service Layer - Request Creation

- [x] 4.1 Create server/src/services/vidos.ts module
- [x] 4.2 Implement createAuthorizationRequest function accepting mode and format parameters
- [x] 4.3 Add support for direct_post mode with vc+sd-jwt format
- [x] 4.4 Add support for direct_post mode with mso_mdoc format
- [x] 4.5 Add support for dc_api mode with vc+sd-jwt format
- [x] 4.6 Add support for dc_api mode with mso_mdoc format
- [x] 4.7 Include VIDOS_API_KEY in Authorization header as Bearer token
- [x] 4.8 Construct request URL using VIDOS_AUTHORIZER_URL from env
- [x] 4.9 Return authorization ID and request URL/object based on mode

## 5. Vidos Service Layer - Status Polling

- [x] 5.1 Implement pollAuthorizationStatus function accepting authorization ID
- [x] 5.2 Send GET request to Vidos API with Authorization header
- [x] 5.3 Handle pending status response
- [x] 5.4 Handle completed status response with VP token
- [x] 5.5 Handle failed status response with error message
- [x] 5.6 Handle expired status response
- [x] 5.7 Throw descriptive error for 404 responses (authorization not found)

## 6. Vidos Service Layer - DC API Response Forwarding

- [x] 6.1 Implement forwardDCAPIResponse function accepting authorization ID and VP token
- [x] 6.2 Send POST request to Vidos API with VP token payload
- [x] 6.3 Include Authorization header with VIDOS_API_KEY
- [x] 6.4 Handle successful verification response
- [x] 6.5 Handle failed verification response
- [x] 6.6 Return verification result to caller

## 7. Claim Extraction - SD-JWT VC

- [x] 7.1 Implement extractClaimsFromResponse function with format detection
- [x] 7.2 Add SD-JWT VC decoding logic (JWT decode + selective disclosure expansion)
- [x] 7.3 Normalize field names (family_name → familyName, given_name → givenName, birth_date → birthDate)
- [x] 7.4 Extract optional portrait field
- [x] 7.5 Validate required claims (familyName, givenName, birthDate) are present
- [x] 7.6 Return ExtractedClaims object

## 8. Claim Extraction - mdoc

- [x] 8.1 Evaluate and select CBOR library (cbor-x, cbor, or @stablelib/cbor)
- [x] 8.2 Add CBOR library dependency if needed
- [x] 8.3 Implement mdoc CBOR decoding logic
- [x] 8.4 Normalize mdoc field names to camelCase
- [x] 8.5 Extract optional portrait field from mdoc
- [x] 8.6 Validate required claims are present in mdoc
- [x] 8.7 Return ExtractedClaims object

## 9. Error Handling

- [x] 9.1 Throw descriptive errors for Vidos API non-2xx responses including status code
- [x] 9.2 Throw descriptive errors for network failures during fetch
- [x] 9.3 Throw descriptive errors for invalid JSON responses
- [x] 9.4 Throw descriptive errors for unsupported credential formats
- [x] 9.5 Throw descriptive errors for missing required claims
- [x] 9.6 Ensure errors propagate to route handler level for HTTP mapping

## 10. Shared Package Exports

- [x] 10.1 Add ExtractedClaimsSchema in shared package using Zod
- [x] 10.2 Update shared package exports in package.json to expose new types
- [x] 10.3 Verify cross-package imports work from server and client

## 11. Verification and Testing

- [x] 11.1 Verify server starts without env validation errors when variables are set
- [x] 11.2 Verify server crashes with descriptive error when VIDOS_AUTHORIZER_URL is missing
- [x] 11.3 Verify server crashes with descriptive error when VIDOS_API_KEY is missing
- [x] 11.4 Verify server crashes with descriptive error when VIDOS_AUTHORIZER_URL is invalid URL
- [x] 11.5 Manual test: create user, retrieve by ID and identifier
- [x] 11.6 Manual test: create session, verify expiration check works
- [x] 11.7 Manual test: create pending request, update to completed/failed/expired states
- [x] 11.8 Manual test: call createAuthorizationRequest with mock params (requires valid API key)
- [x] 11.9 Manual test: verify claim extraction from sample SD-JWT VC response
- [x] 11.10 Manual test: verify claim extraction from sample mdoc response (if CBOR library added)
