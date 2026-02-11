# Delta for Vidos Service Integration

## ADDED Requirements

### Requirement: Create Authorization Request for Direct Post Mode
The system SHALL create authorization requests via Vidos API for direct_post presentation mode.

#### Scenario: Create direct_post request with SD-JWT VC format
- **WHEN** caller invokes createAuthorizationRequest with mode "direct_post" and format "vc+sd-jwt"
- **THEN** system sends POST to Vidos API with presentation_definition, response_mode "direct_post", and format "vc+sd-jwt", returns authorization ID and request URL

#### Scenario: Create direct_post request with mdoc format
- **WHEN** caller invokes createAuthorizationRequest with mode "direct_post" and format "mso_mdoc"
- **THEN** system sends POST to Vidos API with presentation_definition, response_mode "direct_post", and format "mso_mdoc", returns authorization ID and request URL

#### Scenario: Include API key in request
- **WHEN** creating authorization request
- **THEN** system includes VIDOS_API_KEY in Authorization header as Bearer token

#### Scenario: Vidos API returns error
- **WHEN** Vidos API responds with non-2xx status
- **THEN** system throws error with descriptive message including status code

### Requirement: Create Authorization Request for DC API Mode
The system SHALL create authorization requests via Vidos API for dc_api presentation mode.

#### Scenario: Create dc_api request with SD-JWT VC format
- **WHEN** caller invokes createAuthorizationRequest with mode "dc_api" and format "vc+sd-jwt"
- **THEN** system sends POST to Vidos API with presentation_definition, response_mode "dc_api", and format "vc+sd-jwt", returns authorization ID and request object

#### Scenario: Create dc_api request with mdoc format
- **WHEN** caller invokes createAuthorizationRequest with mode "dc_api" and format "mso_mdoc"
- **THEN** system sends POST to Vidos API with presentation_definition, response_mode "dc_api", and format "mso_mdoc", returns authorization ID and request object

#### Scenario: DC API request includes credential request
- **WHEN** mode is "dc_api"
- **THEN** Vidos API response includes request object suitable for Digital Credentials API

### Requirement: Poll Authorization Status
The system SHALL poll Vidos API to retrieve authorization status and results.

#### Scenario: Poll pending authorization
- **WHEN** caller invokes pollAuthorizationStatus with authorization ID for pending request
- **THEN** system sends GET to Vidos API and returns status "pending"

#### Scenario: Poll completed authorization
- **WHEN** caller invokes pollAuthorizationStatus with authorization ID for completed request
- **THEN** system sends GET to Vidos API and returns status "completed" with VP token

#### Scenario: Poll failed authorization
- **WHEN** caller invokes pollAuthorizationStatus with authorization ID for failed request
- **THEN** system sends GET to Vidos API and returns status "failed" with error message

#### Scenario: Poll expired authorization
- **WHEN** caller invokes pollAuthorizationStatus with authorization ID for expired request
- **THEN** system sends GET to Vidos API and returns status "expired"

#### Scenario: Include API key in poll request
- **WHEN** polling authorization status
- **THEN** system includes VIDOS_API_KEY in Authorization header as Bearer token

#### Scenario: Vidos API returns 404
- **WHEN** authorization ID not found
- **THEN** system throws error indicating authorization not found

### Requirement: Forward DC API Response
The system SHALL forward VP token responses from Digital Credentials API to Vidos API.

#### Scenario: Forward successful DC API response
- **WHEN** caller invokes forwardDCAPIResponse with authorization ID and VP token
- **THEN** system sends POST to Vidos API with VP token and returns verification result

#### Scenario: Forward failed DC API response
- **WHEN** caller invokes forwardDCAPIResponse with authorization ID and error
- **THEN** system sends POST to Vidos API with error details and returns failure status

#### Scenario: Include API key in forward request
- **WHEN** forwarding DC API response
- **THEN** system includes VIDOS_API_KEY in Authorization header as Bearer token

#### Scenario: Vidos API validates VP token
- **WHEN** forwarding VP token
- **THEN** Vidos API verifies credential signature and responds with extracted claims or error

### Requirement: Extract Claims from SD-JWT VC
The system SHALL extract normalized claims from SD-JWT VC format credentials.

#### Scenario: Extract claims from valid SD-JWT VC
- **WHEN** caller invokes extractClaimsFromResponse with SD-JWT VC response
- **THEN** system decodes JWT, expands selective disclosures, and returns normalized claims object

#### Scenario: Normalize SD-JWT VC field names
- **WHEN** SD-JWT VC contains family_name, given_name, birth_date
- **THEN** system returns claims with familyName, givenName, birthDate (camelCase)

#### Scenario: Extract optional portrait from SD-JWT VC
- **WHEN** SD-JWT VC contains portrait field
- **THEN** system includes portrait in claims object

#### Scenario: SD-JWT VC missing required field
- **WHEN** SD-JWT VC missing family_name, given_name, or birth_date
- **THEN** system throws error indicating missing required claim

### Requirement: Extract Claims from mdoc
The system SHALL extract normalized claims from ISO/IEC 18013-5 mdoc format credentials.

#### Scenario: Extract claims from valid mdoc
- **WHEN** caller invokes extractClaimsFromResponse with mdoc response
- **THEN** system decodes CBOR, validates signature, and returns normalized claims object

#### Scenario: Normalize mdoc field names
- **WHEN** mdoc contains family_name, given_name, birth_date
- **THEN** system returns claims with familyName, givenName, birthDate (camelCase)

#### Scenario: Extract optional portrait from mdoc
- **WHEN** mdoc contains portrait field
- **THEN** system includes portrait in claims object

#### Scenario: mdoc missing required field
- **WHEN** mdoc missing family_name, given_name, or birth_date
- **THEN** system throws error indicating missing required claim

### Requirement: Unified Claim Extraction Interface
The system SHALL provide single extraction function supporting both credential formats.

#### Scenario: Detect credential format
- **WHEN** Vidos response includes format field "vc+sd-jwt"
- **THEN** system uses SD-JWT VC extraction logic

#### Scenario: Detect mdoc format
- **WHEN** Vidos response includes format field "mso_mdoc"
- **THEN** system uses mdoc extraction logic

#### Scenario: Unknown credential format
- **WHEN** Vidos response includes unsupported format
- **THEN** system throws error indicating format not supported

#### Scenario: Return consistent claim structure
- **WHEN** extracting claims from either format
- **THEN** system returns object conforming to ExtractedClaims interface with familyName, givenName, birthDate, optional portrait

### Requirement: Error Propagation
The system SHALL propagate Vidos API errors as exceptions for route handler processing.

#### Scenario: Network error during API call
- **WHEN** fetch to Vidos API fails with network error
- **THEN** system throws error with descriptive message

#### Scenario: Invalid JSON response
- **WHEN** Vidos API returns non-JSON response
- **THEN** system throws error indicating parse failure

#### Scenario: Route handler catches service error
- **WHEN** service throws error
- **THEN** route handler can catch and map to appropriate HTTP status code

### Requirement: Use Environment Configuration
The system SHALL read Vidos API base URL and API key from validated environment config.

#### Scenario: Construct API endpoint URL
- **WHEN** making Vidos API call
- **THEN** system uses VIDOS_AUTHORIZER_URL from env to build full endpoint URL

#### Scenario: Include authorization header
- **WHEN** making Vidos API call
- **THEN** system includes "Authorization: Bearer {VIDOS_API_KEY}" header using key from env

#### Scenario: Environment not validated
- **WHEN** env module not imported before service use
- **THEN** service access to env properties causes runtime error
