# ticket-agent

This use case contains three colocated workspaces:

- `usecases/ticket-agent/web/` - browser demo for creating an OID4VCI delegation offer and guiding agent setup
- `usecases/ticket-agent/shared/` - shared schemas, delegation credential types, and API contracts
- `usecases/ticket-agent/server/` - Hono API backend, issuer endpoints, and booking flow runtime

Useful commands:

```bash
bun run --filter ticket-agent-web check-types
bun run --filter ticket-agent-server check-types
bun run --filter ticket-agent-web build
```

## Environment

### `web/`

- `usecases/ticket-agent/web/.env.local` is checked in with the local API server URL.
- Use `usecases/ticket-agent/web/.env.example` as the template when you want the web app to target a deployed server.

### `server/`

- `usecases/ticket-agent/server/.env.local` is checked in with local `DATABASE_PATH`, `PORT`, and `ISSUER_PUBLIC_URL`.
- Create `usecases/ticket-agent/server/.env` from `usecases/ticket-agent/server/.env.example` and set `VIDOS_AUTHORIZER_URL`.
- Set `VIDOS_API_KEY` only if your authorizer requires bearer auth.
- `ISSUER_PUBLIC_URL` is the public base URL used by the issuer metadata and all OID4VCI endpoints, including credential offer URLs.
- For local testing through ngrok, point `ISSUER_PUBLIC_URL` at your ngrok URL so remote wallets can resolve both the issuer and the offer.
