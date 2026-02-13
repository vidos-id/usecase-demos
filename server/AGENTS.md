# server

Hono API server on Bun. JIT package, no build step.

## Structure

```
src/index.ts    # Hono app, routes, middleware
src/client.ts   # typed hc client export (used by client package)
src/routes/     # route modules
src/middleware/ # shared middleware
src/lib/        # helpers (env, errors)
```

## Hono + Types

- Method-chain on `new Hono()` only; `app.get(); app.post()` loses route types → `hc` becomes `unknown`.
- Export `AppType = typeof app` in `client.ts`, and `hcWithType` for client usage.
- Use `zValidator("json", schema)` on every route input (body/query/param).
- Validate outputs with `schema.parse()` before `c.json()`.
- Schemas live in `shared/src/api/*`, import via `"shared/api/xxx"` only.
- Avoid controller classes; prefer `app.route()` + small routers.

## Pitfalls

- `hc` path params do not match `/` unless encoded. Use `encodeURIComponent`.
- Bun has a 128MiB request limit; raise `Bun.serve({ maxRequestBodySize })` if needed.

## Deployment

Docker-based via Dokploy/Coolify. Bun runs TS directly (no build).

```bash
# From repo root
docker build -f Dockerfile.server -t vidos-server .
```

- Build context: repo root
- Dockerfile: `Dockerfile.server` (in repo root)
- Env vars: `VIDOS_AUTHORIZER_URL` (required), `VIDOS_API_KEY` (optional)

## Database (SQLite + Drizzle)

Schema in `src/db/schema.ts` (DB source of truth). Migrations auto-run on startup.

```bash
# From repo root:
bun run --filter server db:generate   # after schema changes
bun run --filter server db:studio     # GUI browser
```

- `DATABASE_PATH` env var (required) - set in `.env.local` for local dev: `./data/demobank.db`
- Money as INTEGER cents (convert to dollars in API layer)
- JSON columns (`activity`, `metadata`, `result`): use `$type<T>()` + Zod parse on read
- API schemas in `shared/` are separate from DB schema (no shared->server imports)
- `PRAGMA foreign_keys = ON` set on connection for cascades
