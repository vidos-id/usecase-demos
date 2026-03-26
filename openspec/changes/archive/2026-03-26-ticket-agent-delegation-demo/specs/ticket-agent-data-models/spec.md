## Purpose

Event catalog data, booking models, delegation credential schema, and shared Zod types consumed by both the web app and server.

## ADDED Requirements

### Requirement: Event catalog data model

The shared package SHALL define an event catalog as a hardcoded array of 20 event objects. Each event SHALL include: `id` (unique string), `name`, `category` (one of `concert`, `sports`, `festival`, `theatre`, `comedy`), `city`, `venue`, `date` (ISO 8601 date string), `priceEur` (number, price per ticket in EUR), `availableTickets` (number), `identityVerificationRequired` (boolean), `description` (short text), and `imagePrompt` (short, concise prompt for generating a cover image for the event). The catalog SHALL contain 20 events across multiple categories and cities.

#### Scenario: Catalog contains 20 diverse events
- **WHEN** the event catalog is loaded
- **THEN** it SHALL contain exactly 20 events spanning all 5 categories and at least 4 different cities

#### Scenario: Each event has an image prompt
- **WHEN** an event is retrieved from the catalog
- **THEN** it SHALL have a non-empty `imagePrompt` field suitable for image generation

#### Scenario: All events require identity verification
- **WHEN** an event is retrieved from the catalog
- **THEN** `identityVerificationRequired` SHALL be `true` for all events (identity-linked tickets are the premise of this demo)

### Requirement: Booking data model

The shared package SHALL define a booking model with the following fields: `id` (unique string), `eventId`, `quantity` (positive integer), `status` (one of `pending_verification`, `verified`, `confirmed`, `rejected`, `expired`, `error`), `delegatorName` (string, populated after verification), `createdAt` (ISO 8601 timestamp), and `authorizationId` (Vidos authorization ID, populated when verification starts). Zod schemas SHALL be defined for API request/response validation boundaries. Internal-only types SHALL use plain TypeScript interfaces.

#### Scenario: Booking created in pending state
- **WHEN** a new booking is created
- **THEN** it SHALL have status `pending_verification` and no `delegatorName`

#### Scenario: Booking transitions to verified
- **WHEN** delegation credential verification succeeds via Vidos Authorizer
- **THEN** the booking status SHALL transition to `verified` and `delegatorName` SHALL be populated from the extracted credential claims

### Requirement: Delegation credential claim schema

The shared package SHALL define the delegation credential claim structure for VCT `urn:vidos:agent-delegation:1`. The claims SHALL include: `given_name` (string), `family_name` (string), `birth_date` (string, ISO 8601 date), `delegation_scopes` (array of strings), and `valid_until` (string, ISO 8601 timestamp). A Zod schema SHALL be provided for validating extracted credential claims from the Vidos Authorizer response.

#### Scenario: Delegation claims validated after verification
- **WHEN** the Vidos Authorizer returns extracted credential claims
- **THEN** the claims SHALL be parseable against the delegation credential Zod schema

#### Scenario: Delegation scopes are an array of strings
- **WHEN** delegation credential claims are parsed
- **THEN** `delegation_scopes` SHALL be an array containing one or more of: `browse_events`, `purchase_tickets`, `manage_bookings`

### Requirement: Delegation session data model

The shared package SHALL define a delegation session model for tracking the PID verification and credential issuance flow. The model SHALL include: `id` (unique string), `status` (one of `pending_verification`, `verified`, `credential_issued`), `authorizationId` (Vidos authorization ID), `verifiedClaims` (extracted PID claims, populated after verification), `agentPublicKey` (JWK object, populated when user submits agent key), `scopes` (array of delegation scope strings), `issuedCredential` (compact `dc+sd-jwt` string, populated after issuance), and `createdAt` (ISO 8601 timestamp).

#### Scenario: Delegation session created for PID verification
- **WHEN** a user starts the delegation flow
- **THEN** a delegation session SHALL be created with status `pending_verification` and an associated Vidos authorization ID

#### Scenario: Delegation session transitions to credential issued
- **WHEN** PID verification succeeds and the credential is issued
- **THEN** the session status SHALL be `credential_issued` and `issuedCredential` SHALL contain the compact `dc+sd-jwt` string

### Requirement: User data model

The shared package SHALL define a user model with the following fields: `id` (unique string), `username` (unique string), `passwordHash` (string), `identityVerified` (boolean), `givenName` (string, populated after PID verification), `familyName` (string, populated after PID verification), `birthDate` (string, populated after PID verification), `createdAt` (ISO 8601 timestamp). Zod schemas SHALL be defined for signup/signin API request/response boundaries.

#### Scenario: User created without identity verification
- **WHEN** a new user signs up
- **THEN** the user SHALL have `identityVerified` as `false` and empty identity fields

#### Scenario: User updated after PID verification
- **WHEN** PID verification completes
- **THEN** `identityVerified` SHALL be `true` and `givenName`, `familyName`, `birthDate` SHALL be populated from PID claims

### Requirement: API request and response schemas

The shared package SHALL define Zod schemas for all API request and response bodies exchanged between the web app and server. This includes: signup/signin request/response, delegation authorization request/response, delegation issuance request/response, event search parameters, booking creation request/response, and booking status response. Internal types that do not cross API boundaries SHALL use plain TypeScript types without Zod.

#### Scenario: API schemas validate request bodies
- **WHEN** a request body is received by the server
- **THEN** it SHALL be validated against the corresponding Zod schema before processing

#### Scenario: API schemas validate response bodies
- **WHEN** the server returns a response
- **THEN** the response SHALL conform to the corresponding Zod schema
