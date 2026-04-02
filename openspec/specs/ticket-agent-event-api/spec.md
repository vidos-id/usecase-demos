## Purpose

HTTP API hosted on a unique subdomain for user signup/signin, event catalog browsing, booking creation with delegation credential verification via Vidos Authorizer, and booking status polling.

## Requirements

### Requirement: Event catalog API

The server SHALL expose `GET /api/events` to return the full event catalog and `GET /api/events/:id` to return a single event by ID. The events endpoint SHALL support optional query parameters for filtering: `category` (string) and `city` (string). Results SHALL be returned as JSON arrays or objects matching the event data model.

#### Scenario: List all events
- **WHEN** `GET /api/events` is called without filters
- **THEN** the server SHALL return all events in the catalog

#### Scenario: Filter events by category
- **WHEN** `GET /api/events?category=concert` is called
- **THEN** the server SHALL return only events with category `concert`

#### Scenario: Get single event by ID
- **WHEN** `GET /api/events/:id` is called with a valid event ID
- **THEN** the server SHALL return the event object

#### Scenario: Event not found
- **WHEN** `GET /api/events/:id` is called with a non-existent ID
- **THEN** the server SHALL return 404

### Requirement: Booking creation with verification

The server SHALL expose `POST /api/bookings` to create a new booking. The request body SHALL include `eventId` and `quantity`. The server SHALL validate that the event exists and has sufficient available tickets. The booking behavior SHALL depend on authentication:

- **Session-authenticated user (web app)**: The booking uses the user's stored identity (from PID verification). No delegation credential verification is needed. The booking transitions directly to `confirmed` with the user's identity as the booker.
- **No session (agent)**: The server SHALL create a Vidos authorization request with a DCQL query targeting VCT `urn:vidos:agent-delegation:1` and requesting the delegation credential claims. The response SHALL include the booking ID, status `pending_verification`, and the `openid4vp://` authorization URL (`authorizeUrl`) for the agent to present via `openid4vc-wallet present`.

#### Scenario: Session-authenticated booking confirmed immediately
- **WHEN** a valid booking request is submitted by an authenticated user with verified identity
- **THEN** the server SHALL create a booking with status `confirmed` using the user's stored identity

#### Scenario: Unauthenticated booking requires delegation credential
- **WHEN** a valid booking request is submitted without a session
- **THEN** the server SHALL return a booking with status `pending_verification` and an `authorizeUrl` for delegation credential verification

#### Scenario: Booking rejected for non-existent event
- **WHEN** a booking request references a non-existent event ID
- **THEN** the server SHALL return 404

#### Scenario: Booking rejected for insufficient tickets
- **WHEN** a booking request exceeds the available ticket count
- **THEN** the server SHALL return an error indicating insufficient availability

### Requirement: Booking authorization monitor

The server SHALL monitor Vidos authorization status for pending bookings using a polling pattern. The monitor SHALL poll the Vidos Authorizer status endpoint at regular intervals (2 seconds or less). Upon reaching a terminal state (`authorized`, `rejected`, `expired`, `error`), the monitor SHALL update the booking status accordingly. On `authorized`, the server SHALL extract credential claims via the Vidos Authorizer credentials endpoint, validate the `delegation_scopes` claim includes `purchase_tickets`, check `valid_until` has not passed, check the delegation session has not been revoked (application-level revocation), and transition the booking to `confirmed` or `rejected`.

#### Scenario: Authorization succeeds with valid delegation
- **WHEN** the Vidos Authorizer returns `authorized` and the extracted credential contains `purchase_tickets` in `delegation_scopes` and `valid_until` is in the future
- **THEN** the booking SHALL transition to `confirmed` with `delegatorName` populated from the credential claims

#### Scenario: Authorization succeeds but scope insufficient
- **WHEN** the Vidos Authorizer returns `authorized` but the extracted `delegation_scopes` does not include `purchase_tickets`
- **THEN** the booking SHALL transition to `rejected` with an error indicating insufficient delegation scope

#### Scenario: Authorization succeeds but delegation expired
- **WHEN** the Vidos Authorizer returns `authorized` but `valid_until` is in the past
- **THEN** the booking SHALL transition to `rejected` with an error indicating the delegation credential has expired

#### Scenario: Authorization succeeds but delegation revoked
- **WHEN** the Vidos Authorizer returns `authorized` but the associated delegation session has been revoked (user onboarded a new agent)
- **THEN** the booking SHALL transition to `rejected` with an error indicating the delegation has been revoked

#### Scenario: Authorization rejected by wallet or verifier
- **WHEN** the Vidos Authorizer returns `rejected`
- **THEN** the booking SHALL transition to `rejected`

#### Scenario: Authorization expires
- **WHEN** the Vidos Authorizer returns `expired`
- **THEN** the booking SHALL transition to `expired`

### Requirement: Booking status endpoint

The server SHALL expose `GET /api/bookings/:id` to return the current booking status. The response SHALL include: `id`, `eventId`, `quantity`, `status`, `delegatorName` (if verified), `createdAt`, and event details. The endpoint SHALL be used by both the web app (polling after QR display) and the agent (polling after `openid4vc-wallet present`).

#### Scenario: Pending booking status returned
- **WHEN** `GET /api/bookings/:id` is called for a booking in `pending_verification` status
- **THEN** the server SHALL return the booking with status `pending_verification`

#### Scenario: Confirmed booking status returned
- **WHEN** `GET /api/bookings/:id` is called for a confirmed booking
- **THEN** the server SHALL return the booking with status `confirmed`, the delegator name, and event details

#### Scenario: Booking not found
- **WHEN** `GET /api/bookings/:id` is called with a non-existent ID
- **THEN** the server SHALL return 404

### Requirement: Delegation authorization API

The server SHALL expose delegation-related endpoints for the web app's PID verification flow: `POST /api/delegation/authorize` to create a Vidos authorization request for PID verification (returns `authorizationId` and `authorizeUrl`), and `GET /api/delegation/authorize/:id/status` to poll the PID verification status. These endpoints use the same Vidos Authorizer API as existing demos but with a DCQL query requesting PID claims (`given_name`, `family_name`, `birth_date`).

#### Scenario: PID authorization request created
- **WHEN** `POST /api/delegation/authorize` is called
- **THEN** the server SHALL create a Vidos authorization request for PID verification and return the authorization ID and `openid4vp://` authorize URL

#### Scenario: PID authorization status polled
- **WHEN** `GET /api/delegation/authorize/:id/status` is called
- **THEN** the server SHALL return the current authorization status from Vidos

#### Scenario: PID verification completed
- **WHEN** the PID authorization reaches `authorized` status
- **THEN** the server SHALL extract PID claims and store them in the delegation session

### Requirement: Issuer JWKS endpoint

The server SHALL expose `GET /api/issuer/jwks` to return the issuer's public JWKS. This endpoint is used by verifiers to resolve the issuer's signing key for trust validation of the delegation credential.

#### Scenario: JWKS returned
- **WHEN** `GET /api/issuer/jwks` is called
- **THEN** the server SHALL return the issuer's public JWKS in standard JWK Set format

### Requirement: User signup and signin API

The server SHALL expose `POST /api/signup` to create a new user account with username and password, and `POST /api/signin` to authenticate an existing user. Both SHALL return a session token. The server SHALL persist user accounts in SQLite via Drizzle ORM.

#### Scenario: Signup creates user and session
- **WHEN** `POST /api/signup` is called with a valid username and password
- **THEN** the server SHALL create the user, create a session, and return the session token

#### Scenario: Signup rejects duplicate username
- **WHEN** `POST /api/signup` is called with a username that already exists
- **THEN** the server SHALL return an error indicating the username is taken

#### Scenario: Signin authenticates existing user
- **WHEN** `POST /api/signin` is called with valid credentials
- **THEN** the server SHALL return a session token

#### Scenario: Signin rejects invalid credentials
- **WHEN** `POST /api/signin` is called with invalid credentials
- **THEN** the server SHALL return 401

### Requirement: Server structure follows demo-bank patterns

The server SHALL follow the demo-bank server patterns: Hono app with CORS and compress middleware, route modules under `src/routes/`, services under `src/services/`, stores under `src/stores/` using SQLite + Drizzle ORM for persistence, and a typed app export from `src/app.ts`. Route handlers SHALL use `zValidator` for request body validation with Zod schemas imported from the shared package. The server SHALL be deployed on a unique subdomain.

#### Scenario: Server uses SQLite persistence
- **WHEN** users, bookings, or delegation sessions are created
- **THEN** they SHALL be persisted to SQLite via Drizzle ORM

#### Scenario: Routes use Zod validation
- **WHEN** a request with a body is received
- **THEN** it SHALL be validated using `zValidator` with the corresponding shared package Zod schema
