# car-rental

This use case now contains three colocated workspaces:

- `usecases/car-rental/web/` - browser demo for the existing rental flow
- `usecases/car-rental/shared/` - shared rental catalog, Zod schemas, inferred types, and lightweight helpers
- `usecases/car-rental/mcp/` - MCP-first car-rental booking demo with wallet verification widget

Shared rules:

- fleet data lives in `shared/` and is consumed by both `web/` and `mcp/`
- shared cross-package types are inferred from Zod schemas in `shared/src/types/`
- stateful booking and verification logic stays inside the package that owns the runtime flow

Useful commands:

```bash
bun run --filter demo-car-rental check-types
bun run --filter demo-car-rental-shared check-types
bun run --filter mcp-car-rental-agent check-types
bun run --filter demo-car-rental build
bun run --filter mcp-car-rental-agent build:widget
```

## Environment

### `web/`

- `usecases/car-rental/web/.env.local` is checked in with localhost links back to `usecases-home`.
- Create `usecases/car-rental/web/.env` from `usecases/car-rental/web/.env.example` and set `VITE_CAR_RENTAL_AUTHORIZER_URL`.
- Set `VITE_VIDOS_API_KEY` only if your authorizer requires bearer auth.

### `mcp/`

- `usecases/car-rental/mcp/.env.local` is checked in with local `PORT`, `MCP_PATH`, and `PUBLIC_BASE_URL`.
- Create `usecases/car-rental/mcp/.env` from `usecases/car-rental/mcp/.env.example` and set `VIDOS_AUTHORIZER_URL`.
- Set `VIDOS_API_KEY` only if your authorizer requires bearer auth.
- Override `PUBLIC_BASE_URL` in `.env` when exposing the MCP server through a public tunnel or deployed host.
