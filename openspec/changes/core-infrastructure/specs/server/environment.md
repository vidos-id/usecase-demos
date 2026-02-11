# Delta for Server Environment Configuration

## ADDED Requirements

### Requirement: Environment Variable Validation
The system SHALL validate required environment variables at server startup using Zod schema.

#### Scenario: All required variables present
- **WHEN** server starts with VIDOS_AUTHORIZER_URL and VIDOS_API_KEY set
- **THEN** environment validation passes and server continues startup

#### Scenario: Missing required variable
- **WHEN** server starts without VIDOS_AUTHORIZER_URL or VIDOS_API_KEY
- **THEN** Zod validation throws error and server crashes immediately

#### Scenario: Invalid URL format
- **WHEN** VIDOS_AUTHORIZER_URL is not a valid URL
- **THEN** Zod validation throws error and server crashes immediately

#### Scenario: Empty API key
- **WHEN** VIDOS_API_KEY is empty string
- **THEN** Zod validation throws error and server crashes immediately

### Requirement: Vidos Authorizer URL Configuration
The system SHALL require VIDOS_AUTHORIZER_URL environment variable with valid URL format.

#### Scenario: Valid URL provided
- **WHEN** VIDOS_AUTHORIZER_URL is set to "https://authorizer.vidos.dev"
- **THEN** validation passes and value is available as typed string

#### Scenario: HTTP URL provided
- **WHEN** VIDOS_AUTHORIZER_URL uses http:// scheme
- **THEN** validation passes (Zod url() accepts both http and https)

### Requirement: Vidos API Key Configuration
The system SHALL require VIDOS_API_KEY environment variable with non-empty string value.

#### Scenario: Valid API key provided
- **WHEN** VIDOS_API_KEY is set to non-empty string
- **THEN** validation passes and value is available as typed string

#### Scenario: Whitespace-only API key
- **WHEN** VIDOS_API_KEY contains only whitespace
- **THEN** validation passes if length > 0 (caller responsible for trimming)

### Requirement: Type-Safe Environment Access
The system SHALL export validated environment object with TypeScript type inference.

#### Scenario: Import environment config
- **WHEN** module imports env object from env.ts
- **THEN** TypeScript infers VIDOS_AUTHORIZER_URL as string and VIDOS_API_KEY as string

#### Scenario: Access undefined variable
- **WHEN** caller attempts to access property not in schema
- **THEN** TypeScript compilation fails with type error

### Requirement: Fail-Fast on Invalid Configuration
The system SHALL prevent server startup if environment validation fails.

#### Scenario: Validation error before route registration
- **WHEN** env.ts is imported during server initialization
- **THEN** validation error occurs before Hono app registers routes

#### Scenario: Descriptive error message
- **WHEN** validation fails
- **THEN** Zod error message clearly indicates which variable is missing or invalid
