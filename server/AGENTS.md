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
docker build -f server/Dockerfile -t vidos-server .
```

- Build context: repo root (not `server/`)
- Dockerfile: `server/Dockerfile`
- Env vars: `VIDOS_AUTHORIZER_URL` (required), `VIDOS_API_KEY` (optional)
