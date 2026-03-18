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
