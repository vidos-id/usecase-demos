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
