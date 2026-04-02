## Context

This change introduces a fundamentally new credential flow pattern to the demo suite. All existing demos follow a single model: the user presents their own credential from their own wallet. This demo introduces delegated authority where the user authorizes an AI agent by issuing it a credential, and the agent then autonomously presents that credential to a service.

The repo already has proven building blocks: PID verification via Vidos Authorizer (demo-bank, wine-shop, car-rental), MCP-based agent interaction (wine-shop MCP, car-rental MCP), and HTTP API patterns (demo-bank server with Hono). The new demo combines these with a new element: server-side credential issuance via `@vidos-id/openid4vc-issuer` and agent-side credential management via `openid4vc-wallet`.

The demo domain is event ticketing — a platform that sells identity-linked tickets (a growing EU anti-scalping measure). The user delegates their AI agent to browse events and purchase tickets on their behalf. The ticketing platform verifies the agent's delegation credential before completing a purchase.

Key constraints:
- API-only server, no MCP server — the agent interacts via HTTP endpoints described in a `skill.md`, consumed by OpenClaw
- The server issues credentials but is not concerned with how the agent stores or manages them — that is entirely the agent's responsibility via `openid4vc-wallet`
- Credential handoff from user to agent is manual and visual (copy-paste), making the delegation act explicit and observable
- Holder binding uses direct public key embedding (no proof JWT), with the user pasting the agent's JWK public key into the delegation portal
- Verification of the delegation credential during booking uses the standard Vidos Authorizer flow, same as all other demos

## Goals / Non-Goals

**Goals:**
- Demonstrate a credential issuance flow where the demo server acts as an issuer using `@vidos-id/openid4vc-issuer`, producing holder-bound `dc+sd-jwt` credentials.
- Demonstrate agent-as-wallet-holder where an AI agent uses `openid4vc-wallet` to receive, hold, and present verifiable credentials autonomously.
- Show a complete delegation lifecycle: user identity verification, delegation credential issuance, manual handoff, agent credential import, and agent credential presentation for service access.
- Reuse the Vidos Authorizer for both PID verification (delegation portal) and delegation credential verification (booking flow), showing the same infrastructure can handle both standard and custom credential types.
- Keep the web application as a full-featured app with user accounts (signup/signin), PID identity verification, agent onboarding (public key input, scope selection, credential issuance), and the ticketing flow (browse events, book tickets). This allows demonstrating the same use case both ways: user-driven via the web app and agent-driven via OpenClaw.
- Keep the server API simple, with SQLite + Drizzle ORM persistence for booking and delegation sessions following the demo-bank pattern.
- Provide a clear `skill.md` that enables an OpenClaw agent to drive the entire flow without custom MCP tooling.

**Non-Goals:**
- Building an MCP server or MCP tools. The agent uses HTTP API + `openid4vc-wallet` CLI tools only.
- Real payment processing, ticket fulfillment, or venue integration.
- Heavy database infrastructure — SQLite with Drizzle ORM is sufficient, same as demo-bank.
- Managing the agent's wallet from the server side. The server issues the credential; how it is stored and presented is the agent's concern.
- OID4VCI credential offer flow. Issuance is direct (server creates credential, user copies it). OID4VCI is a future enhancement.
- Multi-agent support or agent identity management beyond single-session demo flows.
- Widget or MCP App UI for the agent interaction — the agent flow is entirely text-based via OpenClaw.

## Decisions

### Use a three-package structure under `usecases/ticket-agent/`

The demo should follow the established multi-package pattern from `demo-bank` and `car-rental`: `web/` for the React delegation portal, `server/` for the Bun + Hono API, and `shared/` for catalog data, schemas, and types. This keeps concerns separated while sharing the event catalog and credential schema across both apps.

Alternatives considered:
- Two packages only (web + server with shared code inline): rejected because the shared event catalog and credential schemas are consumed by both apps and benefit from a single source of truth.
- Single package with everything: rejected because the web app and server have different runtimes, build steps, and deployment targets.

### Use Bun + Hono for the server, following demo-bank patterns

The server should use the same Hono-based HTTP API pattern as `demo-bank/server`: CORS middleware, compress middleware, route modules for logical groupings, typed route exports. Unlike the car-rental and wine-shop MCP packages, this server does not need MCP SDK or transport — it is a plain HTTP API consumed by OpenClaw via `skill.md` instructions.

Alternatives considered:
- MCP server like wine-shop and car-rental: rejected because the user explicitly wants API-only, consumed by OpenClaw directly.
- Bun native server without Hono: rejected because Hono provides routing, middleware, and type-safe route composition that would need to be reimplemented.

### Issue delegation credentials via `@vidos-id/openid4vc-issuer` with direct public key binding

The server should use `@vidos-id/openid4vc-issuer` to issue `dc+sd-jwt` delegation credentials. The issuance flow should use the `holderPublicJwk` path in `issueCredential()` rather than requiring a proof JWT. This is supported by the library — when `holderPublicJwk` is provided and `proof` is omitted, the issuer embeds the key directly as the `cnf` claim.

The issuance flow on the server:
1. Generate issuer trust material at startup via `generateIssuerTrustMaterial()`
2. Create a `DemoIssuer` instance configured with VCT `urn:vidos:agent-delegation:1`
3. When the delegation portal submits a request: create a pre-authorized grant with the delegation claims (from verified PID + selected scopes), exchange the code for a token, issue the credential with `holderPublicJwk` set to the agent's pasted public key
4. Return the compact `dc+sd-jwt` credential string to the web app for display

The issuer trust material (JWKS, issuer URL) should be served at a well-known endpoint so verifiers can resolve the issuer's public key. For demo purposes, the server can serve its own JWKS at `/api/issuer/jwks`.

Alternatives considered:
- Require a proof JWT from the agent: rejected because the agent cannot directly interact with the issuer (the user is the intermediary), making proof JWT exchange impractical without adding significant friction.
- OID4VCI credential offer flow: rejected for v1 — adds protocol complexity when the manual handoff is sufficient and more visually demonstrative. Can be added as a future enhancement.

### Verify the delegation credential via Vidos Authorizer using a custom DCQL query

When the agent attempts to book tickets, the server should create a Vidos authorization request with a DCQL query targeting VCT `urn:vidos:agent-delegation:1` and requesting relevant delegation claims. The authorization URL is returned to the agent, who uses `openid4vc-wallet present` to create and submit a VP via `direct_post`.

For Vidos Authorizer to verify the delegation credential, the issuer's trust material needs to be registered or resolvable. The server should expose its issuer JWKS, and the Vidos Authorizer instance should be configured to trust this issuer for the delegation VCT.

The verification DCQL query should request:
- `given_name`, `family_name`, `birth_date` — to identify the delegator
- `delegation_scopes` — to confirm the agent has the required scope for the action
- `valid_until` — to check the delegation has not expired

Alternatives considered:
- Local by-value `openid4vp://` verification without Vidos Authorizer: rejected because using Vidos Authorizer is consistent with all other demos and demonstrates the same infrastructure works for custom credential types.
- Skip verification entirely and trust the credential on import: rejected because the demo's purpose is to show verifiable delegation.

### Manual credential handoff via copy-paste

After the server issues the delegation offer, the web app displays it as a copyable string. The user manually pastes it into the OpenClaw chat, and the agent redeems it via `openid4vc-wallet receive`. This is deliberate: it makes the delegation act visible and theatrical for demo presentations. The audience sees the offer move from the issuer to the agent.

Alternatives considered:
- Automatic server-to-agent delivery: rejected because it bypasses the user's conscious delegation act and is less visually impressive in demos.
- QR code scanning: rejected because the agent is a CLI/chat tool without camera access.

### Build the web app as a full-featured application with user accounts

The web app should be a complete application with user sessions, not a one-shot wizard. The user flow should be:

1. **Signup / Signin**: Username/password authentication with bcrypt-hashed passwords. Creates a user session.
2. **Identity verification**: The user confirms their identity by presenting their PID via Vidos Authorizer (QR code / DC API). This is a prerequisite for agent onboarding. Identity verification is persistent — once verified, the user's identity claims are stored on their user record and survive session changes.
3. **Agent onboarding**: Once identity is verified, the user can onboard one AI agent at a time by pasting the agent's wallet public key, selecting delegation scopes, and receiving the issued delegation credential. Re-onboarding a new agent revokes the previous delegation at application level.
4. **Event browsing and booking**: The user can browse events and book tickets. When the user books via the web app, their session and stored identity are used directly (no delegation credential presentation needed). Only agent-initiated bookings require delegation credential verification.

After signin, the user sees a dashboard-style layout with sidebar/tabs: Events (catalog + booking), My Agent (onboarding + credential), Identity (verification status), My Bookings.

The web app should be hosted at the `/ticket-agent/` subpath. The PID verification step follows the established pattern from other demos: create a Vidos authorization request, display a QR code (or trigger DC API), poll for status, extract claims on success.

The landing page at `/ticket-agent/` should be an explainer/marketing page with Sign Up / Sign In CTAs, good for presentations. After signing in, the user sees a dashboard-style layout.

The server should be deployed on a unique subdomain: `api-ticket-agent.demo.vidos.id`.

Alternatives considered:
- One-shot wizard without user accounts: rejected because the user needs a persistent session to verify identity, onboard the agent, and then browse/book. The sequential dependency (identity before agent onboarding) requires session state.
- Delegation-only web app with no event browsing: rejected because showing both the user-driven and agent-driven paths makes the demo more versatile for presentations.
- Straight to signin (no landing page): rejected because the explainer page is valuable for presentations to set context.

### Split booking authorization: session-based for users, credential-based for agents

When the user books tickets via the web app, they are already authenticated (session) and identity-verified (stored PID claims). The web app booking flow uses the session and stored identity directly — no delegation credential presentation. When the agent books tickets via the API, the booking endpoint creates a Vidos authorization request for the delegation credential. The agent presents it via `openid4vc-wallet present`, and the server polls Vidos for the result.

This split is intentional: the web app demonstrates the user experience, while the agent path demonstrates the credential-based delegation model. The API endpoints for events and bookings are public (no session auth required), so the agent doesn't need an API token — the delegation credential IS the authorization mechanism.

Alternatives considered:
- Require delegation credential for all bookings (user and agent): rejected because the user already proved their identity via PID and has a session; requiring a second credential presentation is redundant and confusing.
- Give the agent a session token: rejected because it undermines the demo's core message that the credential proves authority.

### Persist issuer trust material to disk

The issuer key pair and certificates SHALL be generated once and persisted to a file on disk (or loaded from environment). Subsequent server restarts SHALL load the existing key material instead of regenerating. This ensures previously issued delegation credentials remain verifiable by the Vidos Authorizer, which has the issuer's trust anchor certificates pre-configured.

Alternatives considered:
- Regenerate on every restart: rejected because it invalidates all previously issued credentials and breaks the trust chain with the Vidos Authorizer.
- Store in SQLite: rejected because key material is infrastructure configuration, not application data. File-based storage is simpler and can be volume-mounted in containers.

### Application-level credential revocation

When a user onboards a new agent (new public key, new scopes), the previous delegation session is marked as revoked in the database. At booking verification time, after extracting claims from the Vidos Authorizer, the server checks whether the delegation session associated with the credential is still active. If revoked, the booking is rejected. This is application-level revocation — the credential itself is not modified or status-listed.

SD-JWT status list support can be added as a future enhancement for spec-level revocation.

Alternatives considered:
- Left to expire naturally: rejected because the user explicitly requested revocation capability.
- SD-JWT status list: deferred to a future enhancement — adds significant complexity (hosted status list endpoint, issuer embeds status claim, Vidos Authorizer checks status list).

### One agent per user at a time

Each user can onboard at most one agent at a time. Re-onboarding a new agent replaces and revokes the previous one. This simplifies the data model, the UI, and the credential lifecycle. Multi-agent support can be added later.

Alternatives considered:
- Multiple agents with different scopes: rejected as unnecessary complexity for v1.

### Define the delegation credential schema with explicit scopes and validity

The delegation credential should use VCT `urn:vidos:agent-delegation:1` with the following claim structure:
- `given_name`, `family_name`, `birth_date` — delegator identity, derived from the verified PID
- `delegation_scopes` — array of strings representing permitted actions (e.g., `["browse_events", "purchase_tickets", "manage_bookings"]`)
- `valid_until` — ISO 8601 timestamp for credential expiry

All claims should be selectively disclosable (the issuer library derives disclosure frames automatically from non-reserved top-level claims). The `cnf` claim is set automatically by the issuer when `holderPublicJwk` is provided.

Alternatives considered:
- Nested `delegator` and `delegation` claim objects: rejected because the issuer library's SD-JWT implementation applies selective disclosure at the top level, and nested structures would complicate disclosure frame management without clear benefit.
- Omit scopes and rely on the credential type alone: rejected because scoped delegation is a key differentiator of this demo.

### Structure the event catalog as static mock data in the shared package

Similar to the wine catalog in `wine-shop/shared` and the car inventory in `car-rental/shared`, the event catalog should be a hardcoded array of 20 event objects in the shared package. Events should include: id, name, category (concert, sports, festival, theatre, comedy), city, venue, date, price range, available tickets, whether identity verification is required, and an `imagePrompt` field containing a short, concise prompt for generating a cover image for the event.

Alternatives considered:
- Database-backed event catalog: rejected as unnecessary complexity for a demo.
- Event catalog owned by the server only: rejected because the web app may also display events for context.

### Use `openid4vc-wallet present` with Vidos Authorizer URLs

The Vidos Authorizer returns `openid4vp://` scheme authorization URLs. The `openid4vc-wallet present` command already supports `openid4vp://` authorization URLs with by-value DCQL queries. The `skill.md` should instruct the agent to use the authorize URL returned by the server's booking endpoint directly with `openid4vc-wallet present --request <url>`.

The wallet-cli `present` command supports `direct_post` response mode, which is what Vidos Authorizer uses. The agent's wallet will parse the authorization request, match the delegation credential, create a selective disclosure presentation with KB-JWT, and submit it via `direct_post` back to Vidos.

Alternatives considered:
- Have the agent call the Vidos API directly: rejected because `openid4vc-wallet present` encapsulates the VP creation, KB-JWT signing, and direct_post submission.
- Build a custom presentation endpoint on the server: rejected because that would duplicate what wallet-cli already does.

## Risks / Trade-offs

- [Vidos Authorizer may not trust the demo issuer for delegation VCT out of the box] → Mitigate by providing the issuer's trust anchor certificates to the Vidos Authorizer instance during deployment configuration. The verifier will have trust anchor certificates pre-configured.
- [Manual copy-paste handoff may feel clunky for non-demo audiences] → Accept for v1. The theatricality is the point. Future versions can add OID4VCI offer flow for automatic agent-side claim.
- [SQLite file may grow with demo usage] → Mitigate with TTL-based cleanup for expired bookings and delegation sessions, same pattern as demo-bank.
- [`@vidos-id/openid4vc-issuer` supports Bun-based consumers] → This matches the existing server runtime (Bun). No risk for this project, but worth noting if the server runtime changes.
- [Delegation credential expiry is not enforced by the issuer at presentation time] → The verifier (Vidos Authorizer) should check `valid_until` via policy evaluation. If not, the server should check the claim after extracting credentials. Document which layer enforces expiry.
- [Scope enforcement is application-level, not cryptographic] → The server must check `delegation_scopes` from the extracted credential claims against the requested action. This is business logic, not protocol-level. Acceptable for a demo, but worth calling out.

## Migration Plan

1. Add the issuer dependency to the monorepo and install from npm.
2. Scaffold `usecases/ticket-agent/` with `web/`, `server/`, and `shared/` workspace packages.
3. Implement the shared package: event catalog, Zod schemas for validated boundaries (API request/response), plain TypeScript types for internal usage, delegation credential types, DCQL helpers.
4. Implement the server following demo-bank server patterns for route structure and code style: Hono app, SQLite + Drizzle ORM for booking and delegation session persistence, issuer service (trust material generation at startup, credential issuance), Vidos service (PID verification + delegation credential verification), event API routes, booking routes with verification flow.
5. Implement the web app at `/ticket-agent/` subpath: signup/signin, PID identity verification, agent onboarding with public key input, scope selection, credential display, event catalog, and ticket booking. Use the frontend-design skill for UI design.
6. Write the `skill.md` agent instructions: describe all API endpoints, `openid4vc-wallet` commands, and the end-to-end flow.
7. Test the full delegation flow end-to-end: PID verification → credential issuance → manual handoff → agent receive → event browsing → booking with verification → confirmation.
8. Add the demo to the home navigator use case grid.
9. Add Dockerfile and Lightsail deployment configuration. Server on unique subdomain, web app at `/ticket-agent/` subpath.

Rollback: remove the `usecases/ticket-agent/` directory and the home navigator entry. No other demos or shared packages are affected.

## Open Questions

- _(resolved)_ Vidos Authorizer returns `openid4vp://` scheme URLs, which `openid4vc-wallet present` already supports. No format conversion needed.
- _(resolved)_ The Vidos Authorizer instance will have the demo issuer's trust anchor certificates pre-configured. No runtime trust bootstrapping needed.
- _(resolved)_ The delegation portal should display event catalog information and support all agent actions (browse, book) directly in the web UI. This allows demonstrating the same flow both ways: user-driven via the web app, and agent-driven via OpenClaw.
