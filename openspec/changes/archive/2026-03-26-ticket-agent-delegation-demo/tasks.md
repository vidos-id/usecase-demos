## 1. Monorepo Setup

- [x] 1.1 Add `@vidos-id` dependency configuration to the monorepo for the issuer package
- [x] 1.2 Scaffold `usecases/ticket-agent/shared/` workspace package with `package.json`, `tsconfig.json`, and subpath exports for `./types/*` and `./lib/*`
- [x] 1.3 Scaffold `usecases/ticket-agent/server/` workspace package with `package.json`, `tsconfig.json`, and dependencies on shared package, `vidos-api`, `hono`, `openapi-fetch`, `@vidos-id/openid4vc-issuer`, `drizzle-orm`, `better-sqlite3`
- [x] 1.4 Scaffold `usecases/ticket-agent/web/` workspace package with `package.json`, `tsconfig.json`, Vite config (base: `/ticket-agent/`), TanStack Router, Tailwind CSS, and shadcn/ui setup
- [x] 1.5 Run `bun install` and verify all workspace dependencies resolve

## 2. Shared Package — Data Models

- [x] 2.1 Create event catalog data in `shared/src/lib/events.ts` with 20 events across all 5 categories (concert, sports, festival, theatre, comedy) and at least 4 cities. Each event includes an `imagePrompt` field with a short, concise prompt for cover image generation.
- [x] 2.2 Create event type definitions in `shared/src/types/events.ts` (Zod schema for API boundaries, plain TS types for internal use). Include `imagePrompt` field.
- [x] 2.3 Create booking type definitions in `shared/src/types/bookings.ts` with status enum, booking model, and API request/response Zod schemas
- [x] 2.4 Create delegation credential claim schema in `shared/src/types/delegation.ts` with VCT constant, claim Zod schema, delegation scopes enum, and delegation session model
- [x] 2.5 Create user type definitions in `shared/src/types/users.ts` with user model (username, passwordHash, identityVerified, identity fields) and signup/signin API Zod schemas
- [x] 2.6 Create API request/response Zod schemas in `shared/src/api/` for signup/signin, delegation authorization, delegation issuance, event search, booking creation, and booking status

## 3. Server — Foundation

- [x] 3.1 Create `server/src/app.ts` with Hono app, CORS and compress middleware, and route registration following demo-bank pattern
- [x] 3.2 Create `server/src/index.ts` entry point with port config and startup validation
- [x] 3.3 Create `server/src/env.ts` for environment variable validation (`VIDOS_AUTHORIZER_URL`, `VIDOS_API_KEY`, server port)
- [x] 3.4 Set up SQLite + Drizzle ORM in `server/src/db/` with schema for users, bookings, delegation sessions, and sessions tables
- [x] 3.5 Create `server/src/routes/health.ts` health check route

## 4. Server — Vidos Service

- [x] 4.1 Create `server/src/services/vidos.ts` with singleton `openapi-fetch` client for Vidos Authorizer API
- [x] 4.2 Implement `createPIDAuthorizationRequest()` for PID verification in the identity confirmation flow (DCQL query for `given_name`, `family_name`, `birth_date`)
- [x] 4.3 Implement `createDelegationAuthorizationRequest()` for delegation credential verification in the booking flow (DCQL query for VCT `urn:vidos:agent-delegation:1` with delegation claims)
- [x] 4.4 Implement `pollAuthorizationStatus()` and `getExtractedCredentials()` following demo-bank patterns

## 5. Server — Issuer Service

- [x] 5.1 Create `server/src/services/issuer.ts` with trust material persistence: load existing key material from disk if present, otherwise generate via `generateIssuerTrustMaterial()` and persist to disk. Create `DemoIssuer` instance from `@vidos-id/openid4vc-issuer`.
- [x] 5.2 Implement `issueDelegationCredential()` that takes verified PID claims, agent public JWK, and scopes, and returns a compact `dc+sd-jwt` credential string via the pre-authorized grant → token exchange → issue credential flow with `holderPublicJwk`
- [x] 5.3 Implement `getIssuerJwks()` to return the issuer's public JWKS for the `/api/issuer/jwks` endpoint

## 6. Server — Stores

- [x] 6.1 Create `server/src/stores/users.ts` with SQLite-backed CRUD for users (create with bcrypt-hashed password, get by username, get by ID, update identity verification status and claims, authenticate with bcrypt compare)
- [x] 6.2 Create `server/src/stores/sessions.ts` with SQLite-backed session management (create, get by ID, delete)
- [x] 6.3 Create `server/src/stores/delegation-sessions.ts` with SQLite-backed CRUD for delegation sessions (create, get by ID, get active by user ID, update status, store verified claims, store issued credential, revoke previous session when new agent onboarded)
- [x] 6.4 Create `server/src/stores/bookings.ts` with SQLite-backed CRUD for bookings (create, get by ID, update status, store delegator name and authorization ID)

## 7. Server — Authorization Monitor

- [x] 7.1 Create `server/src/services/authorization-monitor.ts` with polling-based Vidos status monitoring following demo-bank/car-rental patterns (poll every 2 seconds, handle terminal states)
- [x] 7.2 Implement PID verification monitor: on authorization `authorized`, extract PID claims and update user's identity verification status
- [x] 7.3 Implement booking monitor: on delegation authorization `authorized`, extract delegation claims, validate `purchase_tickets` scope, check `valid_until` not expired, check delegation session not revoked (application-level revocation), and transition booking to `confirmed` or `rejected`

## 8. Server — Routes

- [x] 8.1 Create `server/src/routes/signup.ts` with `POST /` for user signup (username + password)
- [x] 8.2 Create `server/src/routes/signin.ts` with `POST /` for user signin
- [x] 8.3 Create `server/src/routes/identity.ts` with `POST /verify` (create PID authorization for identity verification) and `GET /verify/:id/status` (poll status)
- [x] 8.4 Create `server/src/routes/delegation.ts` with `POST /issue` (issue delegation credential — requires verified identity)
- [x] 8.5 Create `server/src/routes/events.ts` with `GET /` (list/filter events) and `GET /:id` (single event)
- [x] 8.6 Create `server/src/routes/bookings.ts` with `POST /` (create booking — if session-authenticated user: use stored identity, if no session: require delegation credential verification via Vidos Authorizer) and `GET /:id` (booking status)
- [x] 8.7 Create `server/src/routes/issuer.ts` with `GET /jwks` (issuer public JWKS)
- [x] 8.8 Register all routes in `app.ts` under `/api/signup`, `/api/signin`, `/api/identity`, `/api/delegation`, `/api/events`, `/api/bookings`, `/api/issuer`

## 9. Web App — Foundation (use frontend-design skill for all UI)

- [x] 9.1 Set up TanStack Router with file-based routing, layout component, and base path `/ticket-agent/`
- [x] 9.2 Configure API client for server communication pointing to the unique subdomain
- [x] 9.3 Create landing/explainer page at `/ticket-agent/` with demo concept explanation, delegation flow overview, and Sign Up / Sign In CTAs
- [x] 9.4 Implement auth context/provider for managing user session state across the app

## 10. Web App — Auth Pages (use frontend-design skill)

- [x] 10.1 Create signup page with username/password form
- [x] 10.2 Create signin page with username/password form
- [x] 10.3 Create authenticated dashboard layout with sidebar/tabs navigation (Events, My Agent, Identity, My Bookings), user info display, and sign-out

## 11. Web App — Identity Verification (use frontend-design skill)

- [x] 11.1 Create identity verification page with QR code display, status polling, and success/error states
- [x] 11.2 Show identity verification status on the user's profile/dashboard (verified vs. not verified)

## 12. Web App — Agent Onboarding (use frontend-design skill)

- [x] 12.1 Create agent onboarding page gated behind identity verification (show message if not verified)
- [x] 12.2 Implement agent public key input with JWK JSON validation
- [x] 12.3 Implement scope selection checkboxes with descriptions
- [x] 12.4 Create credential display page with copy-to-clipboard button, credential summary (delegator name, scopes, expiry), and handoff instructions

## 13. Web App — Ticketing Flow (use frontend-design skill)

- [x] 13.1 Create event catalog page with category/city filtering and event cards showing cover images
- [x] 13.2 Create event detail page with booking form (quantity input, book button)
- [x] 13.3 Create booking flow for web app users: uses session + stored identity (no delegation credential verification needed), booking confirmation display

## 14. Agent Skill File

- [x] 14.1 Write `skill.md` documenting: intro message, fixed flow sequence, all API endpoints with example requests/responses, `openid4vc-wallet` commands for init/receive/present, autonomous credential presentation (no QR code generation), booking status polling behavior, and terminal status handling

## 15. Home Navigator Integration

- [x] 15.1 Add ticket agent demo entry to `usecases-home` use case grid with title "Event Tickets with Agent Delegation", category "Consumer", credential pills ["PID", "Delegation Credential"], app URL at `/ticket-agent/`, and AI guide link
- [x] 15.2 Create ticket agent chat mockup component (`chatgpt-ticket-agent-mockup.tsx`) using `animated-chat-mockup` with delegation-specific flow: wallet init → offer handoff → receive → browse events → book → autonomous `openid4vc-wallet present` (no QR widget) → confirmation
- [x] 15.3 Create ticket agent agent guide page route with the chat mockup, setup instructions, and skill file link

## 16. Infrastructure

- [x] 16.1 Create Dockerfile for the ticket-agent server
- [x] 16.2 Add Lightsail container deployment configuration for server at `api-ticket-agent.demo.vidos.id`
- [x] 16.3 Configure web app static site deployment at `/ticket-agent/` subpath
- [x] 16.4 Configure Vidos Authorizer trust anchors for the demo issuer's certificates

## 17. Validation

- [x] 17.1 Run `bun run check-types` and fix any type errors across all three packages
- [x] 17.2 Run `bun run lint` and `bun run format` to ensure code style compliance
- [ ] 17.3 Test end-to-end flow: signup → signin → PID identity verification → agent onboarding → credential issuance → manual handoff → agent import → event browsing → booking with autonomous delegation verification → confirmation
