## Why

Existing demos (wine shop, car rental, demo bank) all follow one pattern: the user directly presents their own EUDI Wallet credential. There is no demo that shows delegated authority — where a user authorizes an AI agent to act on their behalf using a verifiable credential the agent holds in its own wallet. This is a key emerging pattern aligned with the EU's "Natural or legal person representation" EUDI use case (currently listed as "coming soon"). Building this demo positions Vidos ahead of the curve, demonstrates credential issuance via `@vidos-id/openid4vc-issuer`, showcases `openid4vc-wallet` as an agent-consumable tool for autonomous credential presentation against the Vidos Authorizer, and introduces the first demo where the server both issues and verifies credentials in the same use case.

## What Changes

- Add a new use case demo at `usecases/ticket-agent/` — an identity-verified event ticketing platform where an AI agent purchases tickets on behalf of the user using a delegation credential.
- Add a web app (`ticket-agent/web/`): React application hosted at `/ticket-agent/` subpath with username/password signup and signin, PID identity verification, agent onboarding (paste agent's wallet public key, select delegation scopes, receive holder-bound `dc+sd-jwt` delegation credential), event browsing, and ticket booking with delegation credential verification.
- Add a server application (`ticket-agent/server/`): Bun + Hono HTTP API on a unique subdomain that handles user signup/signin, PID identity verification, delegation credential issuance via `@vidos-id/openid4vc-issuer`, event catalog, and booking creation with delegation credential verification via Vidos Authorizer.
- Add a shared package (`ticket-agent/shared/`): event catalog data, Zod schemas for events, bookings, and delegation credentials, DCQL query helpers for delegation credential verification, and shared types.
- Add an agent skill file (`skill.md`): instructions for OpenClaw agents describing the HTTP API endpoints, `openid4vc-wallet` usage for credential receipt and OpenID4VP presentation, and the end-to-end delegation flow.
- Introduce a new credential type `urn:vidos:agent-delegation:1` as a `dc+sd-jwt` credential containing delegator identity claims derived from the verified PID, delegation scopes, validity period, and a `cnf` claim binding the credential to the agent's wallet public key.
- Add `@vidos-id/openid4vc-issuer` as a new dependency for server-side credential issuance.
- Update the home navigator use case grid to include the ticket agent demo.

## Capabilities

### New Capabilities
- `ticket-agent-delegation-portal`: Web application hosted at `/ticket-agent/` with username/password signup/signin, PID identity verification, agent onboarding (public key input, scope selection, credential issuance with visual handoff), event browsing, and ticket booking.
- `ticket-agent-event-api`: HTTP API for event catalog browsing, booking creation with delegation credential verification via Vidos Authorizer, and booking status polling.
- `ticket-agent-credential-issuance`: Server-side credential issuance service using `@vidos-id/openid4vc-issuer` to produce holder-bound `dc+sd-jwt` delegation credentials, binding to the agent's public key via direct `cnf` embedding without requiring a proof JWT.
- `ticket-agent-agent-skill`: OpenClaw skill file describing the HTTP API endpoints, `openid4vc-wallet` integration for credential receipt and `openid4vp://` presentation, and the complete agent-side delegation and purchasing flow.
- `ticket-agent-data-models`: Event catalog (20 events with image generation prompts), booking models, delegation credential schema with VCT `urn:vidos:agent-delegation:1`, and shared Zod types consumed by both the web app and server.

### Modified Capabilities
- `centralized-demo-guidance`: Add ticket agent demo entry to the home navigator use case grid with category, credential pills, and links.

## Impact

- New workspace packages `ticket-agent/web`, `ticket-agent/server`, and `ticket-agent/shared` added to the monorepo under `usecases/ticket-agent/`.
- New external dependency `@vidos-id/openid4vc-issuer` from the `@vidos-id` scope on npm.
- Vidos Authorizer API is used twice in this demo: once for PID verification in the delegation portal, and once for delegation credential verification during booking. Both use the same API surface as existing demos but with different DCQL queries and VCTs.
- Infrastructure will need a new Dockerfile and Lightsail container deployment for the server on a unique subdomain. The web app deploys as a static site at the `/ticket-agent/` subpath following existing patterns.
- Agent tooling depends on `openid4vc-wallet` being available as an OpenClaw tool. The agent uses `openid4vc-wallet init` (to generate its holder key), `openid4vc-wallet receive` (to redeem and store the delegation credential), and `openid4vc-wallet present` (to create and submit a VP in response to an `openid4vp://` authorization URL).
- No breaking changes to existing demos or shared packages.
