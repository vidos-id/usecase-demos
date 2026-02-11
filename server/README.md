# server

Hono API on Bun. API-only, type-safe RPC, Zod-validated I/O.

## Conventions

- Method-chain routes on `new Hono()` to preserve `hc` types.
- Validate inputs with `zValidator("json", schema)`; validate outputs with `schema.parse()`.
- Schemas live in `shared/src/api/*` and are imported via `"shared/api/xxx"`.
- Export `AppType = typeof app` in `src/client.ts` and `hcWithType` for the client.
