# server

Hono API server running on Bun. JIT package — exports `.ts` source directly, no build step.

## Commands

```bash
bun run dev           # bun --watch src/index.ts
bun run check-types   # tsc --noEmit
```

## Structure

```
src/index.ts    # Hono app, routes, middleware
src/client.ts   # typed hc client export (used by client package)
```

## Conventions

- Validate request bodies with `zValidator("json", schema)` from `@hono/zod-validator`.
- Validate responses with `schema.parse()` before returning.
- Import schemas via subpath: `from "shared/api/hello"`.
- **MUST method-chain** routes on `new Hono()` (`new Hono().get(...).post(...)`). Separate `app.get(...); app.post(...)` statements break type inference — client sees `unknown`.
- `client.ts` captures `typeof app` and exports `hcWithType` — the client package imports it via `"server/client"` for fully typed RPC calls.
- Deploy: run directly with `bun run src/index.ts` (no compilation needed).
