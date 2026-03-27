# wine-shop

This use case contains three colocated workspaces:

- `usecases/wine-shop/web/` - browser storefront demo for wine browsing and checkout
- `usecases/wine-shop/shared/` - shared wine catalog, Zod schemas, and reusable verification helpers
- `usecases/wine-shop/mcp/` - MCP-first wine shopping demo with inline age-verification widget

Shared rules:

- wine catalog data lives in `shared/` and is consumed by both `web/` and `mcp/`
- shared cross-package types are inferred from Zod schemas in `shared/src/types/`
- app-specific cart, checkout, and verification runtime state stays in the package that owns the flow

Useful commands:

```bash
bun run --filter demo-wine-shop check-types
bun run --filter demo-wine-shop-shared check-types
bun run --filter mcp-wine-agent check-types
bun run --filter demo-wine-shop build
bun run --filter mcp-wine-agent build:widget
```

## Environment

### `web/`

- `usecases/wine-shop/web/.env.local` is checked in with localhost links back to `usecases-home`.
- Create `usecases/wine-shop/web/.env` from `usecases/wine-shop/web/.env.example` and set `VITE_WINE_SHOP_AUTHORIZER_URL`.
- Set `VITE_VIDOS_API_KEY` only if your authorizer requires bearer auth.

### `mcp/`

- `usecases/wine-shop/mcp/.env.local` is checked in with local `PORT`, `MCP_PATH`, and `PUBLIC_BASE_URL`.
- Create `usecases/wine-shop/mcp/.env` from `usecases/wine-shop/mcp/.env.example` and set `VIDOS_AUTHORIZER_URL`.
- Set `VIDOS_API_KEY` only if your authorizer requires bearer auth.
- Override `PUBLIC_BASE_URL` in `.env` when exposing the MCP server through a public tunnel or deployed host.
